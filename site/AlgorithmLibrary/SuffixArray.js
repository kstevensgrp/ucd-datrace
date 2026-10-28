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
// DATrace: suffix array visualization, 2026. Written for DATrace @ UC Davis on Galles'
// animation framework.
//
// Build:  prefix doubling. Suffixes are ranked by their first character, then by pairs
//         (rank of the first k characters, rank of the next k) for k = 1, 2, 4, ... until
//         every rank is distinct. Rows slide into each new order; the part of each suffix
//         that has been compared so far is drawn in blue, the rest in grey.
// LCP:    Kasai's algorithm in three phases (Phi, PLCP in text order, LCP), with a second
//         table indexed by text position.
// Search: two binary searches (first and last suffix that starts with the pattern).
// LRS:    the largest LCP value.  LCS: the same scan over the suffix array of T1$T2#,
//         counting only adjacent rows whose suffixes come from different strings.

SuffixArray.ROW_H = 24;
SuffixArray.CELL_H = 20;
SuffixArray.HEADER_Y = 62;
SuffixArray.ROW_Y0 = 86;
SuffixArray.I_X = 30;
SuffixArray.SA_X = 72;
SuffixArray.KEY_X = 145;
SuffixArray.LCP_X = 222;
SuffixArray.OWN_X = 260;
SuffixArray.SUF_X = 286;
SuffixArray.PTR_X = 450;
SuffixArray.J_X = 662;
SuffixArray.T_X = 702;
SuffixArray.PHI_X = 752;
SuffixArray.PLCP_X = 808;
SuffixArray.MAX_ROWS = 16;

SuffixArray.HEAD_COLOR = "#022851";
SuffixArray.TAIL_COLOR = "#767676";
SuffixArray.CELL_COLOR = "#FFFFFF";
SuffixArray.MID_COLOR = "#D6E2F0";
SuffixArray.FOUND_COLOR = "#FFE9A8";
SuffixArray.CURSOR_COLOR = "#C99700";

function SuffixArray(am, w, h)
{
	this.init(am, w, h);
}

SuffixArray.prototype = new Algorithm();
SuffixArray.prototype.constructor = SuffixArray;
SuffixArray.superclass = Algorithm.prototype;

SuffixArray.prototype.init = function(am, w, h)
{
	SuffixArray.superclass.init.call(this, am, w, h);
	this.addControls();
	this.nextIndex = 0;
	this.commands = [];
	this.setup();
	this.initialIndex = this.nextIndex;
}

SuffixArray.prototype.addControls = function()
{
	this.controls = [];
	addLabelToAlgorithmBar("Text:");
	this.textField = addControlToAlgorithmBar("Text", "GATAGACA");
	this.textField.onkeydown = this.returnSubmit(this.textField, this.buildCallback.bind(this), 15, false);
	this.buildButton = addControlToAlgorithmBar("Button", "Build SA");
	this.buildButton.onclick = this.buildCallback.bind(this);
	this.lcpButton = addControlToAlgorithmBar("Button", "LCP");
	this.lcpButton.onclick = this.lcpCallback.bind(this);
	addLabelToAlgorithmBar("Pattern:");
	this.findField = addControlToAlgorithmBar("Text", "");
	this.findField.onkeydown = this.returnSubmit(this.findField, this.findCallback.bind(this), 15, false);
	this.findButton = addControlToAlgorithmBar("Button", "Search");
	this.findButton.onclick = this.findCallback.bind(this);
	this.lrsButton = addControlToAlgorithmBar("Button", "LRS");
	this.lrsButton.onclick = this.lrsCallback.bind(this);
	addLabelToAlgorithmBar("Text 2:");
	this.text2Field = addControlToAlgorithmBar("Text", "CATA");
	this.text2Field.onkeydown = this.returnSubmit(this.text2Field, this.lcsCallback.bind(this), 13, false);
	this.lcsButton = addControlToAlgorithmBar("Button", "LCS");
	this.lcsButton.onclick = this.lcsCallback.bind(this);
	this.controls.push(this.textField, this.buildButton, this.lcpButton, this.findField,
	                   this.findButton, this.lrsButton, this.text2Field, this.lcsButton);
}

// Status lines and the column headers live for the whole session.
SuffixArray.prototype.setup = function()
{
	this.cmd("CreateLabel", 0, "", 20, 8, 0);
	this.cmd("CreateLabel", 1, "", 20, 28, 0);
	this.nextIndex = 2;
	this.headerKeyID = this.nextIndex++;
	var headers = [["i", SuffixArray.I_X], ["SA[i]", SuffixArray.SA_X],
	               ["rank", SuffixArray.KEY_X], ["LCP[i]", SuffixArray.LCP_X]];
	for (var c = 0; c < headers.length; c++)
	{
		var id = (c == 2) ? this.headerKeyID : this.nextIndex++;
		this.cmd("CreateLabel", id, headers[c][0], headers[c][1], SuffixArray.HEADER_Y, 1);
		this.cmd("SetForegroundColor", id, SuffixArray.HEAD_COLOR);
	}
	var sufHeader = this.nextIndex++;
	this.cmd("CreateLabel", sufHeader, "suffix  T[SA[i]..]", SuffixArray.SUF_X, SuffixArray.HEADER_Y - 7, 0);
	this.cmd("SetForegroundColor", sufHeader, SuffixArray.HEAD_COLOR);
	this.animationManager.StartNewAnimation(this.commands);
	this.animationManager.skipForward();
	this.animationManager.clearHistory();
	this.clearModel();
}

SuffixArray.prototype.clearModel = function()
{
	this.T = null;          // text including terminator(s)
	this.n = 0;
	this.n1 = -1;           // length of T1 + "$" for a two-string (LCS) array, else -1
	this.sa = null;
	this.rank = null;
	this.lcp = null;
	this.phi = null;
	this.plcp = null;
	this.rows = null;       // rows[pos] = graphic IDs for the row showing suffix pos
	this.rowOf = null;      // rowOf[pos] = display row of suffix pos
	this.headLen = null;    // headLen[pos] = characters drawn in the head (blue) color
	this.iLabels = null;
	this.ownHeader = -1;
	this.right = null;      // the Phi / PLCP table
	this.built = false;
}

SuffixArray.prototype.reset = function()
{
	this.nextIndex = this.initialIndex;
	this.clearModel();
}

// ---------------------------------------------------------------- input

SuffixArray.prototype.clean = function(s, maxLen)
{
	return s.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, maxLen);
}

SuffixArray.prototype.buildCallback = function(event)
{
	var s = this.clean(this.textField.value, SuffixArray.MAX_ROWS - 1);
	if (s.length > 0)
	{
		this.textField.value = s;
		this.implementAction(this.buildAction.bind(this), s);
	}
}

SuffixArray.prototype.lcpCallback = function(event)
{
	this.implementAction(this.lcpAction.bind(this), "");
}

SuffixArray.prototype.findCallback = function(event)
{
	var p = this.clean(this.findField.value, SuffixArray.MAX_ROWS);
	if (p.length > 0)
	{
		this.findField.value = p;
		this.implementAction(this.searchAction.bind(this), p);
	}
}

SuffixArray.prototype.lrsCallback = function(event)
{
	this.implementAction(this.lrsAction.bind(this), "");
}

SuffixArray.prototype.lcsCallback = function(event)
{
	var s1 = this.clean(this.textField.value, SuffixArray.MAX_ROWS - 3);
	var s2 = this.clean(this.text2Field.value, SuffixArray.MAX_ROWS - 2 - s1.length);
	if (s1.length > 0 && s2.length > 0)
	{
		this.textField.value = s1;
		this.text2Field.value = s2;
		this.implementAction(this.lcsAction.bind(this), s1 + "|" + s2);
	}
}

// ---------------------------------------------------------------- drawing helpers

SuffixArray.prototype.setStatus = function(line, text)
{
	this.cmd("SetText", line, text);
}

SuffixArray.prototype.rowY = function(r)
{
	return SuffixArray.ROW_Y0 + r * SuffixArray.ROW_H;
}

// left-justified labels are positioned by their top edge
SuffixArray.prototype.textY = function(r)
{
	return this.rowY(r) - 7;
}

SuffixArray.prototype.measure = function(s)
{
	if (this.measureContext == null)
	{
		this.measureContext = document.createElement("canvas").getContext("2d");
	}
	this.measureContext.font = CANVAS_FONT;
	return this.measureContext.measureText(s).width;
}

SuffixArray.prototype.cell = function(text, w, x, y)
{
	var id = this.nextIndex++;
	this.cmd("CreateRectangle", id, text, w, SuffixArray.CELL_H, x, y);
	this.cmd("SetForegroundColor", id, SuffixArray.HEAD_COLOR);
	this.cmd("SetBackgroundColor", id, SuffixArray.CELL_COLOR);
	return id;
}

SuffixArray.prototype.label = function(text, x, y, centered, color)
{
	var id = this.nextIndex++;
	this.cmd("CreateLabel", id, text, x, y, centered ? 1 : 0);
	this.cmd("SetForegroundColor", id, color || SuffixArray.HEAD_COLOR);
	return id;
}

SuffixArray.prototype.owner = function(pos)
{
	return (this.n1 < 0 || pos < this.n1) ? 1 : 2;
}

// Draw the first h characters of suffix pos in the head color, the rest in grey.
SuffixArray.prototype.splitSuffix = function(pos, h)
{
	var suffix = this.T.substring(pos);
	h = Math.min(h, suffix.length);
	this.headLen[pos] = h;
	var row = this.rows[pos];
	this.cmd("SetText", row.head, suffix.substring(0, h));
	this.cmd("SetText", row.tail, suffix.substring(h));
	this.cmd("SetPosition", row.tail, SuffixArray.SUF_X + this.measure(suffix.substring(0, h)),
	         this.textY(this.rowOf[pos]));
}

SuffixArray.prototype.moveRow = function(pos, r)
{
	var row = this.rows[pos];
	var y = this.rowY(r);
	this.rowOf[pos] = r;
	this.cmd("Move", row.sa, SuffixArray.SA_X, y);
	this.cmd("Move", row.key, SuffixArray.KEY_X, y);
	this.cmd("Move", row.lcp, SuffixArray.LCP_X, y);
	if (row.own >= 0)
	{
		this.cmd("Move", row.own, SuffixArray.OWN_X, y);
	}
	var head = this.T.substring(pos, pos + this.headLen[pos]);
	this.cmd("Move", row.head, SuffixArray.SUF_X, this.textY(r));
	this.cmd("Move", row.tail, SuffixArray.SUF_X + this.measure(head), this.textY(r));
}

SuffixArray.prototype.setRowColor = function(pos, color)
{
	var row = this.rows[pos];
	this.cmd("SetBackgroundColor", row.sa, color);
	this.cmd("SetBackgroundColor", row.key, color);
	this.cmd("SetBackgroundColor", row.lcp, color);
}

// Undo any highlighting left by the previous operation.
SuffixArray.prototype.normalize = function()
{
	if (this.rows == null) return;
	for (var pos = 0; pos < this.n; pos++)
	{
		this.setRowColor(pos, SuffixArray.CELL_COLOR);
		if (this.built && this.headLen[pos] != this.n - pos)
		{
			this.splitSuffix(pos, this.n - pos);
		}
	}
	this.setStatus(0, "");
	this.setStatus(1, "");
}

SuffixArray.prototype.deleteRight = function()
{
	if (this.right == null) return;
	var groups = [this.right.headers, this.right.j, this.right.t, this.right.phi, this.right.plcp];
	for (var g = 0; g < groups.length; g++)
	{
		for (var k = 0; k < groups[g].length; k++)
		{
			this.cmd("Delete", groups[g][k]);
		}
	}
	this.right = null;
}

SuffixArray.prototype.deleteTable = function()
{
	if (this.rows == null) return;
	this.deleteRight();
	for (var pos = 0; pos < this.n; pos++)
	{
		var row = this.rows[pos];
		this.cmd("Delete", row.sa);
		this.cmd("Delete", row.key);
		this.cmd("Delete", row.lcp);
		if (row.own >= 0) this.cmd("Delete", row.own);
		this.cmd("Delete", row.head);
		this.cmd("Delete", row.tail);
		this.cmd("Delete", this.iLabels[pos]);
	}
	if (this.ownHeader >= 0)
	{
		this.cmd("Delete", this.ownHeader);
	}
	this.clearModel();
}

// ---------------------------------------------------------------- build (prefix doubling)

SuffixArray.prototype.buildAction = function(s)
{
	this.commands = [];
	this.build(s, null);
	return this.commands;
}

SuffixArray.prototype.build = function(s1, s2)
{
	this.deleteTable();
	this.T = (s2 == null) ? s1 + "$" : s1 + "$" + s2 + "#";
	this.n = this.T.length;
	this.n1 = (s2 == null) ? -1 : s1.length + 1;
	var T = this.T, n = this.n;
	this.sa = [];
	this.rows = [];
	this.rowOf = [];
	this.headLen = [];
	this.iLabels = [];
	this.cmd("SetText", this.headerKeyID, "rank");
	if (this.n1 >= 0)
	{
		this.ownHeader = this.label("own", SuffixArray.OWN_X, SuffixArray.HEADER_Y, true);
	}
	for (var pos = 0; pos < n; pos++)
	{
		var y = this.rowY(pos);
		this.sa[pos] = pos;
		this.rowOf[pos] = pos;
		this.headLen[pos] = 0;
		this.iLabels[pos] = this.label(String(pos), SuffixArray.I_X, y, true);
		var row = {};
		row.sa = this.cell(String(pos), 40, SuffixArray.SA_X, y);
		row.key = this.cell("", 84, SuffixArray.KEY_X, y);
		row.lcp = this.cell("", 40, SuffixArray.LCP_X, y);
		row.own = (this.n1 >= 0) ? this.cell(String(this.owner(pos)), 28, SuffixArray.OWN_X, y) : -1;
		row.head = this.label("", SuffixArray.SUF_X, this.textY(pos), false, SuffixArray.HEAD_COLOR);
		row.tail = this.label(T.substring(pos), SuffixArray.SUF_X, this.textY(pos), false, SuffixArray.TAIL_COLOR);
		this.rows[pos] = row;
	}
	this.setStatus(0, "Suffix array of \"" + T + "\"" +
	               (this.n1 >= 0 ? "  (T1 + $ + T2 + #: one array for both strings)" : ""));
	this.setStatus(1, "Start with every suffix in text order: SA[i] = i. Terminators sort first: # < $ < A.");
	this.cmd("Step");

	// round 0: rank by the first character
	this.setStatus(0, "Round 0: sort by the first character");
	this.setStatus(1, "The key of each suffix is its first character");
	for (pos = 0; pos < n; pos++)
	{
		this.splitSuffix(pos, 1);
		this.cmd("SetText", this.rows[pos].key, "'" + T.charAt(pos) + "'");
	}
	this.cmd("Step");
	var keys = [];
	for (pos = 0; pos < n; pos++)
	{
		keys[pos] = [T.charCodeAt(pos), 0];
	}
	this.sortAndRank(keys, "Sort the rows by that character");

	var k = 1, round = 1;
	while (this.maxRank < n - 1)
	{
		this.setStatus(0, "Round " + round + ": k = " + k + ", sort by the first " + (2 * k) + " characters");
		this.setStatus(1, "Key = (rank of the first " + k + ", rank of the next " + k +
		               "); the second part is - past the end of the text");
		this.cmd("SetText", this.headerKeyID, "(r[i], r[i+" + k + "])");
		for (pos = 0; pos < n; pos++)
		{
			var second = (pos + k < n) ? this.rank[pos + k] : -1;
			keys[pos] = [this.rank[pos], second];
			this.cmd("SetText", this.rows[pos].key,
			         "(" + this.rank[pos] + ", " + (second < 0 ? "-" : second) + ")");
			this.splitSuffix(pos, 2 * k);
		}
		this.cmd("Step");
		this.sortAndRank(keys, "Sort the rows by the pair (the real algorithm uses two radix-sort passes)");
		k *= 2;
		round++;
	}

	this.cmd("SetText", this.headerKeyID, "rank");
	for (pos = 0; pos < n; pos++)
	{
		this.splitSuffix(pos, n - pos);
	}
	this.built = true;
	this.setStatus(0, "Done after " + (round - 1) + " doubling round" + (round == 2 ? "" : "s") +
	               ": SA = [" + this.sa.join(", ") + "]");
	this.setStatus(1, "Every rank is distinct, so the order is final. rank[SA[i]] = i");
	this.cmd("Step");
}

// Stable-sort the rows by key[pos] (a pair), slide them into place, then give equal keys
// equal ranks.
SuffixArray.prototype.sortAndRank = function(keys, sortMessage)
{
	var n = this.n;
	// Array.sort is not guaranteed stable in old browsers: break ties by current row
	var rowOf = this.rowOf;
	var order = this.sa.slice(0);
	order.sort(function(a, b)
	{
		if (keys[a][0] != keys[b][0]) return keys[a][0] - keys[b][0];
		if (keys[a][1] != keys[b][1]) return keys[a][1] - keys[b][1];
		return rowOf[a] - rowOf[b];
	});
	this.setStatus(1, sortMessage);
	for (var r = 0; r < n; r++)
	{
		this.moveRow(order[r], r);
	}
	this.sa = order;
	this.cmd("Step");

	this.rank = [];
	var rank = 0;
	for (r = 0; r < n; r++)
	{
		var pos = order[r];
		if (r > 0)
		{
			var prev = order[r - 1];
			if (keys[pos][0] != keys[prev][0] || keys[pos][1] != keys[prev][1])
			{
				rank++;
			}
		}
		this.rank[pos] = rank;
		this.cmd("SetText", this.rows[pos].key, String(rank));
	}
	this.maxRank = rank;
	this.setStatus(1, "New ranks: equal keys get equal ranks. Largest rank = " + rank +
	               (rank == n - 1 ? " = n-1, all distinct" : " < n-1 = " + (n - 1) + ", so double k"));
	this.cmd("Step");
}

// ---------------------------------------------------------------- LCP (Kasai)

SuffixArray.prototype.lcpAction = function(unused)
{
	this.commands = [];
	if (!this.built)
	{
		this.setStatus(0, "Build the suffix array first");
		this.setStatus(1, "");
		return this.commands;
	}
	this.normalize();
	this.computeLCP();
	return this.commands;
}

SuffixArray.prototype.computeLCP = function()
{
	var T = this.T, n = this.n, sa = this.sa;
	this.deleteRight();
	for (var pos = 0; pos < n; pos++)
	{
		this.cmd("SetText", this.rows[pos].lcp, "");
	}

	// the Phi / PLCP table, one row per text position j
	var right = {headers: [], j: [], t: [], phi: [], plcp: []};
	var heads = [["j", SuffixArray.J_X], ["T[j]", SuffixArray.T_X],
	             ["Phi[j]", SuffixArray.PHI_X], ["PLCP[j]", SuffixArray.PLCP_X]];
	for (var c = 0; c < heads.length; c++)
	{
		right.headers.push(this.label(heads[c][0], heads[c][1], SuffixArray.HEADER_Y, true));
	}
	for (var j = 0; j < n; j++)
	{
		var y = this.rowY(j);
		right.j.push(this.label(String(j), SuffixArray.J_X, y, true));
		right.t.push(this.cell(T.charAt(j), 30, SuffixArray.T_X, y));
		right.phi.push(this.cell("", 40, SuffixArray.PHI_X, y));
		right.plcp.push(this.cell("", 46, SuffixArray.PLCP_X, y));
	}
	this.right = right;
	this.setStatus(0, "LCP array by Kasai's algorithm: a second table, indexed by text position j");
	this.setStatus(1, "Phase 1: Phi[SA[i]] = SA[i-1], the suffix just above in sorted order");
	this.cmd("Step");

	// phase 1: the first entry on its own, the rest together
	this.phi = [];
	this.phi[sa[0]] = -1;
	this.cmd("SetText", right.phi[sa[0]], "-");
	var flying = [];
	for (var r = 1; r < n; r++)
	{
		this.phi[sa[r]] = sa[r - 1];
		var id = this.label(String(sa[r - 1]), SuffixArray.SA_X, this.rowY(r - 1), true);
		this.cmd("Move", id, SuffixArray.PHI_X, this.rowY(sa[r]));
		flying.push(id);
		if (r == 1)
		{
			this.setRowColor(sa[0], SuffixArray.MID_COLOR);
			this.setRowColor(sa[1], SuffixArray.MID_COLOR);
			this.setStatus(1, "Phase 1: row 1 holds suffix " + sa[1] + "; the row above holds " + sa[0] +
			               ", so Phi[" + sa[1] + "] = " + sa[0] + " (row 0 has nothing above: -)");
			this.cmd("Step");
			this.setRowColor(sa[0], SuffixArray.CELL_COLOR);
			this.setRowColor(sa[1], SuffixArray.CELL_COLOR);
			this.setStatus(1, "Phase 1: the same for every row");
		}
	}
	this.cmd("Step");
	for (r = 0; r < flying.length; r++)
	{
		this.cmd("Delete", flying[r]);
	}
	for (j = 0; j < n; j++)
	{
		this.cmd("SetText", right.phi[j], this.phi[j] < 0 ? "-" : String(this.phi[j]));
	}

	// phase 2: PLCP in text order, reusing L
	this.setStatus(0, "Phase 2: PLCP[j] = LCP of suffix j and suffix Phi[j], for j in text order");
	this.setStatus(1, "Key fact: PLCP[j+1] >= PLCP[j] - 1, so L never restarts from 0");
	this.cmd("Step");
	this.plcp = [];
	var L = 0;
	var c1 = this.nextIndex++, c2 = this.nextIndex++;
	for (j = 0; j < n; j++)
	{
		var p = this.phi[j];
		if (p < 0)
		{
			this.plcp[j] = 0;
			L = 0;
			this.cmd("SetText", right.plcp[j], "0");
			this.cmd("SetBackgroundColor", right.plcp[j], SuffixArray.MID_COLOR);
			this.setStatus(1, "j = " + j + ": Phi[j] = - (first in sorted order), so PLCP[j] = 0 and L = 0");
			this.cmd("Step");
			this.cmd("SetBackgroundColor", right.plcp[j], SuffixArray.CELL_COLOR);
			continue;
		}
		this.cmd("SetBackgroundColor", right.plcp[j], SuffixArray.MID_COLOR);
		this.cmd("CreateHighlightCircle", c1, SuffixArray.CURSOR_COLOR, SuffixArray.T_X, this.rowY(j + L), 13);
		this.cmd("CreateHighlightCircle", c2, "#0000FF", SuffixArray.T_X, this.rowY(p + L), 13);
		this.setStatus(1, "j = " + j + ", Phi[j] = " + p + ": compare T[" + j + "+L] with T[" + p +
		               "+L], starting at L = " + L);
		this.cmd("Step");
		while (T.charAt(j + L) == T.charAt(p + L))
		{
			L++;
			this.cmd("Move", c1, SuffixArray.T_X, this.rowY(j + L));
			this.cmd("Move", c2, SuffixArray.T_X, this.rowY(p + L));
			this.setStatus(1, "j = " + j + ": '" + T.charAt(j + L - 1) + "' matches, L = " + L);
			this.cmd("Step");
		}
		this.plcp[j] = L;
		this.cmd("SetText", right.plcp[j], String(L));
		this.setStatus(1, "j = " + j + ": '" + T.charAt(j + L) + "' vs '" + T.charAt(p + L) +
		               "' differ, so PLCP[" + j + "] = " + L + (L > 0 ? "; next j starts at L = " + (L - 1) : ""));
		this.cmd("Step");
		this.cmd("Delete", c1);
		this.cmd("Delete", c2);
		this.cmd("SetBackgroundColor", right.plcp[j], SuffixArray.CELL_COLOR);
		if (L > 0) L--;
	}

	// phase 3: back to suffix-array order
	this.setStatus(0, "Phase 3: LCP[i] = PLCP[SA[i]]");
	this.setStatus(1, "Each value moves to the row of its suffix");
	flying = [];
	this.lcp = [];
	for (r = 0; r < n; r++)
	{
		this.lcp[r] = this.plcp[sa[r]];
		id = this.label(String(this.lcp[r]), SuffixArray.PLCP_X, this.rowY(sa[r]), true);
		this.cmd("Move", id, SuffixArray.LCP_X, this.rowY(r));
		flying.push(id);
	}
	this.cmd("Step");
	for (r = 0; r < n; r++)
	{
		this.cmd("Delete", flying[r]);
		this.cmd("SetText", this.rows[sa[r]].lcp, String(this.lcp[r]));
	}
	this.setStatus(0, "LCP[i] = length of the longest common prefix of the suffixes in rows i-1 and i");
	this.setStatus(1, "Computed in O(n): L goes up at most 2n times in total");
	this.cmd("Step");
}

// ---------------------------------------------------------------- search

SuffixArray.prototype.prefixCompare = function(pos, p)
{
	var s = this.T.substring(pos, pos + p.length);
	return s < p ? -1 : (s > p ? 1 : 0);
}

SuffixArray.prototype.searchAction = function(p)
{
	this.commands = [];
	if (!this.built)
	{
		this.setStatus(0, "Build the suffix array first");
		this.setStatus(1, "");
		return this.commands;
	}
	this.normalize();
	var n = this.n, m = p.length;
	this.setStatus(0, "Search for \"" + p + "\": every occurrence is a run of adjacent rows");
	this.setStatus(1, "Binary search 1 finds the first row starting with it, binary search 2 the row after the last");
	var lo = this.label("← lo", SuffixArray.PTR_X, this.textY(0), false, "#0000FF");
	var mid = this.label("← mid", SuffixArray.PTR_X + 48, this.textY(0), false, SuffixArray.CURSOR_COLOR);
	var hi = this.label("← hi", SuffixArray.PTR_X + 108, this.textY(n), false, "#0000FF");
	for (var pos = 0; pos < n; pos++)
	{
		this.splitSuffix(pos, m);
	}
	this.cmd("Step");

	var bounds = [];
	for (var pass = 0; pass < 2; pass++)
	{
		var a = 0, b = n;
		this.cmd("Move", lo, SuffixArray.PTR_X, this.textY(a));
		this.cmd("Move", hi, SuffixArray.PTR_X + 108, this.textY(b));
		this.setStatus(0, pass == 0 ? "Binary search 1: first row whose first " + m + " characters are >= \"" + p + "\""
		                            : "Binary search 2: first row whose first " + m + " characters are > \"" + p + "\"");
		while (a < b)
		{
			var c = (a + b) >> 1;
			var spos = this.sa[c];
			var cmp = this.prefixCompare(spos, p);
			this.cmd("Move", mid, SuffixArray.PTR_X + 48, this.textY(c));
			this.setRowColor(spos, SuffixArray.MID_COLOR);
			var shown = this.T.substring(spos, spos + m);
			var goRight = (pass == 0) ? (cmp < 0) : (cmp <= 0);
			this.setStatus(1, "mid = " + c + ": \"" + shown + "\" " + (cmp < 0 ? "<" : (cmp > 0 ? ">" : "=")) +
			               " \"" + p + "\", so " + (goRight ? "lo = mid + 1" : "hi = mid"));
			this.cmd("Step");
			this.setRowColor(spos, SuffixArray.CELL_COLOR);
			if (goRight) { a = c + 1; } else { b = c; }
			this.cmd("Move", lo, SuffixArray.PTR_X, this.textY(a));
			this.cmd("Move", hi, SuffixArray.PTR_X + 108, this.textY(b));
		}
		bounds[pass] = a;
		this.setStatus(1, "lo = hi = " + a + (pass == 0 ? ": first candidate row" : ": one past the last match"));
		this.cmd("Step");
	}
	this.cmd("Delete", lo);
	this.cmd("Delete", mid);
	this.cmd("Delete", hi);

	var first = bounds[0], last = bounds[1];
	if (first >= last)
	{
		this.setStatus(0, "\"" + p + "\" does not occur in the text");
		this.setStatus(1, "The two searches met at the same row: an empty range");
	}
	else
	{
		var where = [];
		for (var r = first; r < last; r++)
		{
			this.setRowColor(this.sa[r], SuffixArray.FOUND_COLOR);
			where.push(this.sa[r]);
		}
		where.sort(function(x, y) { return x - y; });
		var count = last - first;
		this.setStatus(0, "\"" + p + "\" occurs " + count + " time" + (count == 1 ? "" : "s") + ": " +
		               (count == 1 ? "row " + first + ", text position " : "rows " + first + " to " + (last - 1) +
		                ", text positions ") + where.join(", "));
		this.setStatus(1, "O(m log n): each of the log n comparisons reads at most m characters");
	}
	this.cmd("Step");
	return this.commands;
}

// ---------------------------------------------------------------- LRS and LCS

SuffixArray.prototype.lrsAction = function(unused)
{
	this.commands = [];
	if (!this.built)
	{
		this.setStatus(0, "Build the suffix array first");
		this.setStatus(1, "");
		return this.commands;
	}
	this.normalize();
	if (this.lcp == null)
	{
		this.setStatus(0, "The longest repeated substring needs the LCP array: computing it first");
		this.setStatus(1, "");
		this.cmd("Step");
		this.computeLCP();
	}
	this.scanLCP(false);
	return this.commands;
}

SuffixArray.prototype.lcsAction = function(both)
{
	this.commands = [];
	var parts = both.split("|");
	this.build(parts[0], parts[1]);
	this.computeLCP();
	this.scanLCP(true);
	return this.commands;
}

// LRS: the largest LCP. LCS: the largest LCP between rows owned by different strings.
SuffixArray.prototype.scanLCP = function(commonOnly)
{
	var n = this.n, sa = this.sa;
	this.setStatus(0, commonOnly
		? "Longest common substring: the largest LCP[i] where rows i-1 and i come from different strings"
		: "Longest repeated substring: the largest LCP[i]");
	this.setStatus(1, "");
	var cursor = this.nextIndex++;
	this.cmd("CreateHighlightCircle", cursor, SuffixArray.CURSOR_COLOR, SuffixArray.LCP_X, this.rowY(1), 16);
	var best = 0, bestRow = -1;
	for (var r = 1; r < n; r++)
	{
		this.cmd("Move", cursor, SuffixArray.LCP_X, this.rowY(r));
		var mixed = this.owner(sa[r]) != this.owner(sa[r - 1]);
		var counts = !commonOnly || mixed;
		var msg = "i = " + r + ": LCP = " + this.lcp[r];
		if (!counts)
		{
			msg += ", but both suffixes come from T" + this.owner(sa[r]) + ": skip";
		}
		else if (this.lcp[r] > best)
		{
			best = this.lcp[r];
			bestRow = r;
			msg += ", new best";
		}
		this.setStatus(1, msg + (best > 0 ? "  (best so far: " + best + " at row " + bestRow + ")" : ""));
		this.cmd("Step");
	}
	this.cmd("Delete", cursor);
	if (bestRow < 0)
	{
		this.setStatus(0, commonOnly ? "The two strings share no character" : "No character repeats");
		this.setStatus(1, "");
		this.cmd("Step");
		return;
	}
	var a = sa[bestRow - 1], b = sa[bestRow];
	var answer = this.T.substring(b, b + best);
	this.setRowColor(a, SuffixArray.FOUND_COLOR);
	this.setRowColor(b, SuffixArray.FOUND_COLOR);
	this.splitSuffix(a, best);
	this.splitSuffix(b, best);
	if (commonOnly)
	{
		var p1 = this.owner(a) == 1 ? a : b, p2 = this.owner(a) == 1 ? b : a;
		this.setStatus(0, "Longest common substring: \"" + answer + "\" (length " + best + "), at position " +
		               p1 + " of T1 and position " + (p2 - this.n1) + " of T2");
	}
	else
	{
		this.setStatus(0, "Longest repeated substring: \"" + answer + "\" (length " + best +
		               "), at positions " + Math.min(a, b) + " and " + Math.max(a, b));
	}
	this.setStatus(1, "Rows " + (bestRow - 1) + " and " + bestRow + " share it; a tie would give another answer of the same length");
	this.cmd("Step");
}

// ---------------------------------------------------------------- UI plumbing

SuffixArray.prototype.disableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++) this.controls[i].disabled = true;
}

SuffixArray.prototype.enableUI = function(event)
{
	for (var i = 0; i < this.controls.length; i++) this.controls[i].disabled = false;
}

var currentAlg;

function init()
{
	var animManag = initCanvas();
	currentAlg = new SuffixArray(animManag, canvas.width, canvas.height);
}
