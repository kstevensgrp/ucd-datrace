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

	window.DATraceCourse = function (c) {
		var h = [];
		document.title = c.course + " · DATrace @ UC Davis";
		h.push("<h1>" + esc(c.course) + "</h1>");
		if (c.intro) h.push('<p class="lede">' + inline(c.intro) + "</p>");

		var units = c.units || [];
		h.push('<ul class="jump">');
		units.forEach(function (u) {
			h.push('<li><a href="#' + esc(u.id) + '">' + (u.tag ? "<b>" + esc(u.tag) + "</b>" : "") +
				esc(u.short || u.title) + "</a></li>");
		});
		h.push("</ul>");
		if (c.aside) h.push('<p class="aside">' + inline(c.aside) + "</p>");

		units.forEach(function (u) {
			h.push('<section class="unit" id="' + esc(u.id) + '"><header>');
			if (u.label) h.push('<span class="num">' + esc(u.label) + "</span>");
			h.push("<h2>" + esc(u.title) + "</h2>");
			if (u.read) h.push('<a class="read" href="' + esc(safeUrl(u.read)) + '">Read the chapter &#8599;</a>');
			h.push('</header><ul class="viz">');
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
