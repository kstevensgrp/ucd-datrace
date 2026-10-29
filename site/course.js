// DATrace: course pages, 2026.
// course.html?NAME loads courses/NAME.js, which calls DATraceCourse({...}) with the
// course's units (chapters, topics or weeks) and the visualizations that go with each.
// A <script> file rather than JSON so the page also works when opened from disk.
//
// Text fields may use three bits of markup: *italic*, `code` and [text](url).
// Everything else is escaped, so a data file cannot inject HTML.

(function () {
	var NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

	function esc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
			.replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	function safeUrl(u) {
		// relative paths, anchors and http(s) only
		return /^(https?:\/\/|#|[A-Za-z0-9_.\/-]+(\.html)?(#.*)?$)/.test(u) && !/^javascript:/i.test(u) ? u : "#";
	}

	function inline(s) {
		if (s === undefined || s === null) return "";
		var codes = [];
		var t = esc(s).replace(/`([^`]+)`/g, function (m, c) { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
		t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
			return '<a href="' + esc(safeUrl(url.replace(/&amp;/g, "&"))) + '">' + text + "</a>";
		});
		t = t.replace(/\*([^*]+)\*/g, "<i>$1</i>");
		return t.replace(/\u0000(\d+)\u0000/g, function (m, i) { return "<code>" + codes[+i] + "</code>"; });
	}

	function el(id) { return document.getElementById(id); }

	function fail(msg) {
		el("course").innerHTML = '<h1>Course not found</h1><p class="lede">' + msg +
			' See <a href="Algorithms.html">all visualizations</a>.</p>';
	}

	// A reading chip: "Gusfield §1.2–§1.5" shows the book in bold; with a url it links (e.g. to Canvas).
	function reading(r) {
		if (typeof r === "string") r = { text: r };
		var m = /^(.+?)\s+((?:§|Ch\.|pp?\.).*)$/.exec(r.text), body;
		body = m ? "<b>" + esc(m[1]) + "</b> " + esc(m[2]) : esc(r.text);
		return r.url ? '<a class="rd" href="' + esc(safeUrl(r.url)) + '">' + body + "</a>" : '<span class="rd">' + body + "</span>";
	}

	// A visualization slot: { page, name } links to a page; { planned: "Name" } is a placeholder.
	function vizSlot(v) {
		if (v.page) return '<a class="vz live" href="' + esc(safeUrl(v.page)) + '"><span class="ic">&#9654;</span>' + esc(v.name) + "</a>";
		return '<span class="vz planned" title="Planned visualization"><span class="ic">&#9675;</span>' + esc(v.planned) + "</span>";
	}

	function topics(list) {
		var h = ['<ol class="topics">'];
		list.forEach(function (t) {
			if (t.part) { h.push('<li class="part">' + esc(t.part) + "</li>"); return; }
			var viz = [].concat(t.viz || []);
			h.push('<li class="topic' + (viz.length ? "" : " noviz") + '"><div class="tx"><span class="tt">' +
				(t.read ? '<a href="' + esc(safeUrl(t.read)) + '">' + inline(t.title) + "</a>" : inline(t.title)) + "</span>" +
				(t.note ? "<p>" + inline(t.note) + "</p>" : "") +
				(t.readings ? '<span class="rds">' + [].concat(t.readings).map(reading).join("") + "</span>" : "") + "</div>" +
				'<div class="vzs">' + viz.map(vizSlot).join("") + "</div></li>");
		});
		h.push("</ol>");
		return h.join("");
	}

	window.DATraceCourse = function (c) {
		var h = [];
		document.title = c.course + " · DATrace @ UC Davis";
		h.push("<h1>" + esc(c.course) + (c.subtitle ? ' <span class="sub">' + esc(c.subtitle) + "</span>" : "") + "</h1>");
		if (c.intro) h.push('<p class="lede">' + inline(c.intro) + "</p>");
		if (c.books) {
			h.push('<dl class="books">');
			c.books.forEach(function (b) {
				h.push("<dt>" + esc(b.abbr) + "</dt><dd>" + inline(b.title) + "</dd>");
			});
			h.push("</dl>");
		}

		var units = c.units || [];
		h.push('<ul class="jump">');
		units.forEach(function (u) {
			h.push('<li><a href="#' + esc(u.id) + '">' + (u.tag ? "<b>" + esc(u.tag) + "</b>" : "") +
				esc(u.short || u.title) + "</a></li>");
		});
		h.push("</ul>");
		if (c.aside) h.push('<p class="aside">' + inline(c.aside) + "</p>");
		if (units.some(function (u) { return u.topics; })) {
			h.push('<p class="key"><span class="vz live"><span class="ic">&#9654;</span>Animation</span> opens a visualization' +
				' <span class="vz planned"><span class="ic">&#9675;</span>Planned</span> is in the works</p>');
		}

		units.forEach(function (u) {
			h.push('<section class="unit" id="' + esc(u.id) + '"><header>');
			if (u.label) h.push('<span class="num">' + esc(u.label) + "</span>");
			h.push("<h2>" + esc(u.title) + (u.meta ? ' <span class="meta">' + esc(u.meta) + "</span>" : "") + "</h2>");
			if (u.read) h.push('<a class="read" href="' + esc(safeUrl(u.read)) + '">' + esc(u.readLabel || c.readLabel || "Read the chapter") + " &#8599;</a>");
			h.push("</header>");
			if (u.topics) { h.push(topics(u.topics)); h.push("</section>"); return; }
			h.push('<ul class="viz">');
			(u.items || []).forEach(function (it) {
				var sec = [].concat(it.sec || []).map(esc).join("<br>");
				h.push('<li><span class="sec">' + sec + '</span><div><a class="name" href="' +
					esc(safeUrl(it.page)) + '">' + esc(it.name) + "</a>" +
					(it.qualifier ? " <small>(" + esc(it.qualifier) + ")</small>" : "") +
					(it.note ? "<p>" + inline(it.note) + "</p>" : "") + "</div></li>");
			});
			h.push("</ul>");
			if (u.gaps) h.push('<p class="gaps">Not animated yet: ' + inline(u.gaps) + "</p>");
			h.push("</section>");
		});

		if (c.beyond) {
			h.push('<section class="beyond"><h2>' + esc(c.beyond.title || "Beyond the course") + "</h2><p>" +
				inline(c.beyond.text) + ' <a href="Algorithms.html">All visualizations &rarr;</a></p></section>');
		}
		el("course").innerHTML = h.join("\n");
		if (location.hash && el(location.hash.slice(1))) el(location.hash.slice(1)).scrollIntoView();
	};

	window.addEventListener("DOMContentLoaded", function () {
		var name = location.search.replace(/^\?/, "").split("&")[0].toLowerCase();
		if (!name) { fail("No course named in the address (it should end in, for example, <code>course.html?ecs32b</code>)."); return; }
		if (!NAME_RE.test(name)) { fail("That is not a valid course name."); return; }
		var s = document.createElement("script");
		s.src = "courses/" + name + ".js";
		s.onerror = function () { fail("There is no course named <code>" + esc(name) + "</code> on this site."); };
		document.head.appendChild(s);
	});
})();
