// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco
//
// DATrace: suffix tree visualization, 2026. Written for DATrace @ UC Davis on Galles'
// animation framework; layout code follows Trie.js.
//
// Builds the suffix tree of a string one suffix at a time (the naive O(n^2) construction,
// which is the one students can follow), then supports pattern search and the longest
// repeated substring query. Edge labels are substrings; leaves hold the start index of
// their suffix; "$" is the end-of-string terminator and sorts before every other character.

SuffixTree.NODE_WIDTH = 30;
SuffixTree.LINK_COLOR = "#022851";
SuffixTree.HIGHLIGHT_CIRCLE_COLOR = "#C99700";
SuffixTree.FOREGROUND_COLOR = "#022851";
SuffixTree.INTERNAL_COLOR = "#FFFFFF";
SuffixTree.LEAF_COLOR = "#FFE9A8";
SuffixTree.FOUND_COLOR = "#FFBF00";
SuffixTree.LABEL_AT = 0.6;          // where along the edge (parent -> child) the label sits
SuffixTree.LABEL_COLOR = "#022851";
SuffixTree.HEIGHT_DELTA = 64;
SuffixTree.STARTING_Y = 70;
SuffixTree.SPLIT_AT = 0.35;         // where along the old edge a split node first appears
SuffixTree.MAX_LENGTH = 16;

function SuffixTree(am, w, h)
{
	this.init(am, w, h);
}

SuffixTree.prototype = new Algorithm();
SuffixTree.prototype.constructor = SuffixTree;
SuffixTree.superclass = Algorithm.prototype;

SuffixTree.prototype.init = function(am, w, h)
{
	SuffixTree.superclass.init.call(this, am, w, h);
	this.startingX = w / 2;
	this.addControls();
	this.nextIndex = 0;
	this.commands = [];
	// three status labels at the top left, as in Trie.js
	this.cmd("CreateLabel", 0, "", 20, 10, 0);
	this.cmd("CreateLabel", 1, "", 20, 10, 0);
	this.cmd("CreateLabel", 2, "", 20, 30, 0);
	this.nextIndex = 3;
	this.root = null;
	this.text = "";
	this.animationManager.StartNewAnimation(this.commands);
	this.animationManager.skipForward();
	this.animationManager.clearHistory();
}

SuffixTree.prototype.addControls = function()
{
	this.controls = [];
	addLabelToAlgorithmBar("Text:");
	this.buildField = addControlToAlgorithmBar("Text", "BANANA");
	this.buildField.onkeydown = this.returnSubmit(this.buildField, this.buildCallback.bind(this), SuffixTree.MAX_LENGTH, false);
	this.buildButton = addControlToAlgorithmBar("Button", "Build");
	this.buildButton.onclick = this.buildCallback.bind(this);
	addLabelToAlgorithmBar("Pattern:");
	this.findField = addControlToAlgorithmBar("Text", "");
	this.findField.onkeydown = this.returnSubmit(this.findField, this.findCallback.bind(this), SuffixTree.MAX_LENGTH, false);
	this.findButton = addControlToAlgorithmBar("Button", "Search");
	this.findButton.onclick = this.findCallback.bind(this);
	this.lrsButton = addControlToAlgorithmBar("Button", "Longest Repeated Substring");
	this.lrsButton.onclick = this.lrsCallback.bind(this);
	this.controls.push(this.buildField, this.buildButton, this.findField, this.findButton, this.lrsButton);
}

SuffixTree.prototype.reset = function()
{
	this.nextIndex = 3;
	this.root = null;
	this.text = "";
}

SuffixTree.prototype.cleanInput = function(s)
{
	return s.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, SuffixTree.MAX_LENGTH);
}

SuffixTree.prototype.buildCallback = function(event)
{
	var s = this.cleanInput(this.buildField.value);
	if (s.length > 0)
	{
		this.buildField.value = s;
		this.implementAction(this.build.bind(this), s);
	}
}

SuffixTree.prototype.findCallback = function(event)
{
	var s = this.cleanInput(this.findField.value);
	if (s.length > 0 && this.root != null)
	{
		this.findField.value = s;
		this.implementAction(this.search.bind(this), s);
	}
}

SuffixTree.prototype.lrsCallback = function(event)
{
	if (this.root != null)
	{
		this.implementAction(this.longestRepeated.bind(this), "");
	}
}

// ---------------------------------------------------------------- model

function SuffixTreeNode(id, label, leafIndex)
{
	this.graphicID = id;
	this.labelID = -1;         // graphic ID of the edge-label text, threaded onto the edge
	this.label = label;        // substring on the edge from the parent
	this.leafIndex = leafIndex; // start index of the suffix, or -1 for internal nodes
	this.children = [];        // kept sorted by first character, "$" first
	this.parent = null;
	this.depth = 0;            // string depth (characters from the root)
	this.x = 0;
	this.y = 0;
	this.width = 0;
}

SuffixTree.prototype.charOrder = function(c)
{
	return c == "$" ? -1 : c.charCodeAt(0);
}

SuffixTree.prototype.childFor = function(node, c)
{
	for (var i = 0; i < node.children.length; i++)
	{
		if (node.children[i].label.charAt(0) == c)
		{
			return node.children[i];
		}
	}
	return null;
}

SuffixTree.prototype.addChild = function(parent, child)
{
	child.parent = parent;
	child.depth = parent.depth + child.label.length;
	var k = 0;
	while (k < parent.children.length &&
	       this.charOrder(parent.children[k].label.charAt(0)) < this.charOrder(child.label.charAt(0)))
	{
		k++;
	}
	parent.children.splice(k, 0, child);
}

SuffixTree.prototype.replaceChild = function(parent, oldChild, newChild)
{
	for (var i = 0; i < parent.children.length; i++)
	{
		if (parent.children[i] == oldChild)
		{
			parent.children[i] = newChild;
			newChild.parent = parent;
			newChild.depth = parent.depth + newChild.label.length;
			return;
		}
	}
}

SuffixTree.prototype.fixDepths = function(node)
{
	for (var i = 0; i < node.children.length; i++)
	{
		node.children[i].depth = node.depth + node.children[i].label.length;
		this.fixDepths(node.children[i]);
	}
}

// ---------------------------------------------------------------- drawing helpers

// Create a node at (x, y), near where it belongs, so it never flashes up in a corner;
// the next resizeTree() slides it into its final place.
SuffixTree.prototype.newNode = function(label, leafIndex, parent, x, y)
{
	var node = new SuffixTreeNode(this.nextIndex++, label, leafIndex);
	this.cmd("CreateCircle", node.graphicID, leafIndex >= 0 ? String(leafIndex) : "", x, y);
	this.cmd("SetForegroundColor", node.graphicID, SuffixTree.FOREGROUND_COLOR);
	this.cmd("SetBackgroundColor", node.graphicID,
	         leafIndex >= 0 ? SuffixTree.LEAF_COLOR : SuffixTree.INTERNAL_COLOR);
	this.cmd("SetWidth", node.graphicID, SuffixTree.NODE_WIDTH);
	node.x = x;
	node.y = y;
	// The edge label is a text object threaded onto the edge (parent -> label -> child): edges
	// attach to a label's bounding box, so the line visibly breaks around the text. Connect's
	// own midpoint label cannot be used: the framework draws edges over everything, and sibling
	// edges fan out from one point, so labels of more than a couple of characters collide.
	if (label.length > 0)
	{
		node.labelID = this.nextIndex++;
		var lx = parent ? parent.x + SuffixTree.LABEL_AT * (x - parent.x) : x;
		var ly = parent ? parent.y + SuffixTree.LABEL_AT * (y - parent.y) : y - 30;
		this.cmd("CreateLabel", node.labelID, label, lx, ly, 1);
		this.cmd("SetForegroundColor", node.labelID, SuffixTree.LABEL_COLOR);
	}
	return node;
}

// Where a new child of parent first appears: one level down, right of its existing children.
SuffixTree.prototype.spawnBelow = function(parent)
{
	var dy = this.levelDy || SuffixTree.HEIGHT_DELTA;
	var x = parent.x;
	for (var i = 0; i < parent.children.length; i++)
	{
		x = Math.max(x, parent.children[i].x + SuffixTree.NODE_WIDTH * 1.5);
	}
	return [Math.min(x, this.canvasWidth - SuffixTree.NODE_WIDTH), parent.y + dy];
}

// Edge-label width in the real canvas font, so layout follows CANVAS_FONT_SIZE.
SuffixTree.prototype.labelWidth = function(label)
{
	if (this.measureContext == null)
	{
		this.measureContext = document.createElement("canvas").getContext("2d");
	}
	this.measureContext.font = CANVAS_FONT;
	return this.measureContext.measureText(label).width + 6;
}

SuffixTree.prototype.scaleWidths = function(node, factor)
{
	node.width *= factor;
	for (var i = 0; i < node.children.length; i++)
	{
		this.scaleWidths(node.children[i], factor);
	}
}

SuffixTree.prototype.labelPos = function(node)
{
	var p = node.parent;
	return [p.x + SuffixTree.LABEL_AT * (node.x - p.x), p.y + SuffixTree.LABEL_AT * (node.y - p.y)];
}

// parent -> label -> child, undirected
SuffixTree.prototype.connect = function(parent, child)
{
	this.cmd("Connect", parent.graphicID, child.labelID, SuffixTree.LINK_COLOR, 0, false, "");
	this.cmd("Connect", child.labelID, child.graphicID, SuffixTree.LINK_COLOR, 0, false, "");
}

SuffixTree.prototype.disconnect = function(parent, child)
{
	this.cmd("Disconnect", parent.graphicID, child.labelID);
	this.cmd("Disconnect", child.labelID, child.graphicID);
}

SuffixTree.prototype.edgeHighlight = function(parent, child, on)
{
	this.cmd("SetEdgeHighlight", parent.graphicID, child.labelID, on);
	this.cmd("SetEdgeHighlight", child.labelID, child.graphicID, on);
}

SuffixTree.prototype.setStatus = function(line, text)
{
	this.cmd("SetText", line, text);
}

SuffixTree.prototype.clearTree = function(node)
{
	if (node == null) return;
	for (var i = 0; i < node.children.length; i++)
	{
		this.clearTree(node.children[i]);
	}
	if (node.labelID >= 0)
	{
		this.cmd("Delete", node.labelID);
	}
	this.cmd("Delete", node.graphicID);
}

SuffixTree.prototype.setPathHighlight = function(node, on)
{
	// highlight the edges from the root down to node
	var n = node;
	while (n.parent != null)
	{
		this.edgeHighlight(n.parent, n, on);
		n = n.parent;
	}
}

SuffixTree.prototype.collectLeaves = function(node, out)
{
	if (node.leafIndex >= 0)
	{
		out.push(node);
	}
	for (var i = 0; i < node.children.length; i++)
	{
		this.collectLeaves(node.children[i], out);
	}
}

// ---------------------------------------------------------------- layout (after Trie.js)

SuffixTree.prototype.resizeWidths = function(node)
{
	var size = 0;
	for (var i = 0; i < node.children.length; i++)
	{
		size += this.resizeWidths(node.children[i]);
	}
	// an edge label needs room too, or neighbouring labels collide
	// sibling labels sit LABEL_AT of the way down their edges, so they are only
	// LABEL_AT * (slot width) apart
	var labelNeed = (this.labelWidth(node.label) + 8) / SuffixTree.LABEL_AT;
	node.width = Math.max(size, SuffixTree.NODE_WIDTH + 16, labelNeed);
	return node.width;
}

SuffixTree.prototype.treeHeight = function(node)
{
	var h = 0;
	for (var i = 0; i < node.children.length; i++)
	{
		h = Math.max(h, this.treeHeight(node.children[i]));
	}
	return h + 1;
}

SuffixTree.prototype.setNewPositions = function(node, x, y, dy)
{
	node.x = x;
	node.y = y;
	var childX = x - node.width / 2;
	for (var i = 0; i < node.children.length; i++)
	{
		var c = node.children[i];
		this.setNewPositions(c, childX + c.width / 2, y + dy, dy);
		childX += c.width;
	}
}

SuffixTree.prototype.animateNewPositions = function(node)
{
	this.cmd("Move", node.graphicID, node.x, node.y);
	if (node.labelID >= 0)
	{
		var lp = this.labelPos(node);
		this.cmd("Move", node.labelID, lp[0], lp[1]);
	}
	for (var i = 0; i < node.children.length; i++)
	{
		this.animateNewPositions(node.children[i]);
	}
}

SuffixTree.prototype.resizeTree = function()
{
	if (this.root == null) return;
	this.resizeWidths(this.root);
	// too wide for the canvas: squeeze every subtree proportionally (labels may then crowd)
	var available = this.canvasWidth - 20;
	if (this.root.width > available)
	{
		this.scaleWidths(this.root, available / this.root.width);
	}
	var levels = this.treeHeight(this.root);
	var dy = Math.min(SuffixTree.HEIGHT_DELTA,
	                  Math.max(34, (this.canvasHeight - SuffixTree.STARTING_Y - 30) / Math.max(1, levels - 1)));
	this.levelDy = dy;
	var x = Math.max(this.root.width / 2 + 10, this.startingX);
	this.setNewPositions(this.root, x, SuffixTree.STARTING_Y, dy);
	this.animateNewPositions(this.root);
	this.cmd("Step");
}

// ---------------------------------------------------------------- build

SuffixTree.prototype.build = function(s)
{
	this.commands = [];
	this.clearTree(this.root);
	this.root = null;
	this.text = s + "$";
	var T = this.text;
	var n = T.length;

	this.setStatus(0, "Building the suffix tree of \"" + T + "\"");
	this.setStatus(1, "");
	this.setStatus(2, "Appending the terminator $ so that no suffix is a prefix of another suffix");
	this.cmd("Step");

	this.root = this.newNode("", -1, null, this.startingX, SuffixTree.STARTING_Y);
	this.root.depth = 0;
	this.setStatus(2, "Creating the root");
	this.cmd("Step");
	this.resizeTree();

	this.highlightID = this.nextIndex++;

	for (var i = 0; i < n; i++)
	{
		var suffix = T.substring(i);
		this.setStatus(0, "Inserting suffix " + i + ": \"" + suffix + "\"");
		this.setStatus(2, "");
		this.cmd("CreateHighlightCircle", this.highlightID, SuffixTree.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
		this.cmd("SetWidth", this.highlightID, SuffixTree.NODE_WIDTH);
		this.cmd("Step");
		this.insertSuffix(this.root, suffix, i);
		this.cmd("Delete", this.highlightID);
	}

	this.setStatus(0, "Suffix tree of \"" + T + "\": " + n + " leaves, one per suffix");
	this.setStatus(1, "");
	this.setStatus(2, "Leaf labels are the starting index of each suffix; read the edge labels from the root to spell it");
	this.cmd("Step");
	this.setStatus(0, "");
	this.setStatus(2, "");
	return this.commands;
}

// Walk down from node matching s; create a leaf (and maybe split an edge) for the remainder.
SuffixTree.prototype.insertSuffix = function(node, s, leafIndex)
{
	var child = this.childFor(node, s.charAt(0));
	if (child == null)
	{
		this.setStatus(2, "No edge out of this node starts with '" + s.charAt(0) + "': add a leaf for \"" + s + "\"");
		var pos = this.spawnBelow(node);
		var leaf = this.newNode(s, leafIndex, node, pos[0], pos[1]);
		this.addChild(node, leaf);
		this.connect(node, leaf);
		this.cmd("Step");
		this.resizeTree();
		return;
	}

	// match as far as possible along the edge label
	var lab = child.label;
	var k = 0;
	while (k < lab.length && k < s.length && lab.charAt(k) == s.charAt(k))
	{
		k++;
	}
	this.edgeHighlight(node, child, 1);
	this.setStatus(2, "Edge \"" + lab + "\" matches " + k + " character" + (k == 1 ? "" : "s") + " of \"" + s + "\"");
	this.cmd("Step");

	if (k == lab.length)
	{
		// whole edge consumed: continue from the child
		this.edgeHighlight(node, child, 0);
		this.cmd("Move", this.highlightID, child.x, child.y);
		this.setStatus(2, "Whole edge matched; continue below with \"" + s.substring(k) + "\"");
		this.cmd("Step");
		this.insertSuffix(child, s.substring(k), leafIndex);
		return;
	}

	// partial match: split the edge at k
	this.setStatus(2, "Partial match: split the edge after \"" + lab.substring(0, k) + "\"");
	this.cmd("Step");
	this.edgeHighlight(node, child, 0);
	this.cmd("Disconnect", node.graphicID, child.labelID);

	var mid = this.newNode(lab.substring(0, k), -1, node,
	                       node.x + SuffixTree.SPLIT_AT * (child.x - node.x),
	                       node.y + SuffixTree.SPLIT_AT * (child.y - node.y));
	this.replaceChild(node, child, mid);
	child.label = lab.substring(k);
	this.cmd("SetText", child.labelID, child.label);
	this.addChild(mid, child);
	this.fixDepths(mid);
	this.connect(node, mid);
	this.cmd("Connect", mid.graphicID, child.labelID, SuffixTree.LINK_COLOR, 0, false, "");
	this.cmd("Step");
	this.resizeTree();

	this.cmd("Move", this.highlightID, mid.x, mid.y);
	this.setStatus(2, "Add a leaf for the rest, \"" + s.substring(k) + "\"");
	this.cmd("Step");
	pos = this.spawnBelow(mid);
	var leaf = this.newNode(s.substring(k), leafIndex, mid, pos[0], pos[1]);
	this.addChild(mid, leaf);
	this.connect(mid, leaf);
	this.cmd("Step");
	this.resizeTree();
}

// ---------------------------------------------------------------- search

SuffixTree.prototype.search = function(p)
{
	this.commands = [];
	this.setStatus(0, "Searching for \"" + p + "\"");
	this.setStatus(1, "");
	this.setStatus(2, "Follow the edges whose labels spell the pattern");
	this.cmd("CreateHighlightCircle", this.highlightID, SuffixTree.HIGHLIGHT_CIRCLE_COLOR, this.root.x, this.root.y);
	this.cmd("SetWidth", this.highlightID, SuffixTree.NODE_WIDTH);
	this.cmd("Step");

	var node = this.root;
	var rest = p;
	var path = [];
	var found = true;
	while (rest.length > 0)
	{
		var child = this.childFor(node, rest.charAt(0));
		if (child == null)
		{
			this.setStatus(2, "No edge starts with '" + rest.charAt(0) + "': \"" + p + "\" does not occur");
			found = false;
			break;
		}
		var lab = child.label;
		var k = 0;
		while (k < lab.length && k < rest.length && lab.charAt(k) == rest.charAt(k))
		{
			k++;
		}
		this.edgeHighlight(node, child, 1);
		path.push([node, child]);
		if (k < rest.length && k < lab.length)
		{
			this.setStatus(2, "Mismatch on edge \"" + lab + "\" at '" + rest.charAt(k) + "': \"" + p + "\" does not occur");
			this.cmd("Step");
			found = false;
			break;
		}
		this.setStatus(2, "Matched \"" + lab.substring(0, k) + "\"" + (k < rest.length ? ", continue with \"" + rest.substring(k) + "\"" : ""));
		this.cmd("Move", this.highlightID, child.x, child.y);
		this.cmd("Step");
		rest = rest.substring(k);
		node = child;
	}

	if (found)
	{
		var leaves = [];
		this.collectLeaves(node, leaves);
		var idx = [];
		for (var i = 0; i < leaves.length; i++)
		{
			idx.push(leaves[i].leafIndex);
			this.cmd("SetBackgroundColor", leaves[i].graphicID, SuffixTree.FOUND_COLOR);
		}
		idx.sort(function(a, b) { return a - b; });
		this.setStatus(2, "Every leaf below this point starts with \"" + p + "\": occurs at position" +
		               (idx.length == 1 ? " " : "s ") + idx.join(", "));
		this.cmd("Step");
		for (var i = 0; i < leaves.length; i++)
		{
			this.cmd("SetBackgroundColor", leaves[i].graphicID, SuffixTree.LEAF_COLOR);
		}
	}
	else
	{
		this.cmd("Step");
	}
	for (var i = 0; i < path.length; i++)
	{
		this.edgeHighlight(path[i][0], path[i][1], 0);
	}
	this.cmd("Delete", this.highlightID);
	this.setStatus(0, "");
	this.setStatus(2, found ? "\"" + p + "\" found at " + idx.join(", ") : "\"" + p + "\" not found");
	return this.commands;
}

// ---------------------------------------------------------------- longest repeated substring

SuffixTree.prototype.deepestInternal = function(node, best)
{
	if (node.leafIndex < 0 && node != this.root && node.depth > best.depth)
	{
		best = node;
	}
	for (var i = 0; i < node.children.length; i++)
	{
		best = this.deepestInternal(node.children[i], best);
	}
	return best;
}

SuffixTree.prototype.pathLabel = function(node)
{
	var s = "";
	while (node != null)
	{
		s = node.label + s;
		node = node.parent;
	}
	return s;
}

SuffixTree.prototype.longestRepeated = function(unused)
{
	this.commands = [];
	this.setStatus(0, "Longest repeated substring");
	this.setStatus(1, "");
	this.setStatus(2, "An internal node means two or more suffixes share the string spelled on the path to it");
	this.cmd("Step");
	var best = this.deepestInternal(this.root, this.root);
	if (best == this.root)
	{
		this.setStatus(2, "No internal node below the root: no character repeats");
		this.cmd("Step");
		this.setStatus(0, "");
		return this.commands;
	}
	this.setStatus(2, "The deepest internal node (greatest string depth) gives the longest such string");
	this.cmd("Step");
	this.setPathHighlight(best, 1);
	this.cmd("SetHighlight", best.graphicID, 1);
	var s = this.pathLabel(best);
	var leaves = [];
	this.collectLeaves(best, leaves);
	var idx = [];
	for (var i = 0; i < leaves.length; i++) idx.push(leaves[i].leafIndex);
	idx.sort(function(a, b) { return a - b; });
	this.setStatus(2, "Longest repeated substring: \"" + s + "\" (length " + s.length + "), at positions " + idx.join(", "));
	this.cmd("Step");
	this.setPathHighlight(best, 0);
	this.cmd("SetHighlight", best.graphicID, 0);
	this.setStatus(0, "");
	return this.commands;
}

// ---------------------------------------------------------------- UI plumbing

SuffixTree.prototype.disableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++) this.controls[i].disabled = true;
}

SuffixTree.prototype.enableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++) this.controls[i].disabled = false;
}

var currentAlg;

function init()
{
	var animManag = initCanvas();
	currentAlg = new SuffixTree(animManag, canvas.width, canvas.height);
}
