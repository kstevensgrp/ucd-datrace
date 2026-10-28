# DATrace @ UC Davis

Interactive data-structure and algorithm visualizations for introductory
programming courses at UC Davis. Companion to
[CodeTrace](https://github.com/kstevensgrp/ucd-codetrace).

DATrace is a lightly rebranded, self-hosted copy of David Galles'
[Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html)
(University of San Francisco), HTML5/JavaScript release 1.5. The
visualizations are plain HTML + JavaScript with no build step and no
server-side code; any static web server (or `python3 -m http.server`) will
serve `site/`.

## Layout

- `site/` — the website. `Algorithms.html` is the index; each visualization
  is one `*.html` page plus a matching file in `site/AlgorithmLibrary/`.
  `AnimationLibrary/` is the shared animation engine; `ThirdParty/` is
  jQuery 1.5 / jQuery UI 1.8.
- `site/datrace.css`, `site/img/`, `site/favicon.*` — the UC Davis branding
  (masthead, wordmark, favicon). Galles' two stock stylesheets are recolored
  in place; everything else about the look is in `datrace.css`.
- `UPSTREAM.txt` — where the code came from, the tarball checksum, and what
  was dropped on import.
- `LICENSE.txt` — Galles' BSD 2-clause license, which also appears at the
  top of every JavaScript file. Keep both.

## Running locally

```sh
cd site
python3 -m http.server 8080
# open http://localhost:8080/Algorithms.html
```

## Adding a visualization

Copy `site/template.html` to `site/NAME.html` and write `site/AlgorithmLibrary/NAME.js`
following the pattern in `BST.js` (the file header says which placeholders to
fill). Add a link in `site/Algorithms.html`. Galles' tutorial for the animation
API is at <https://www.cs.usfca.edu/~galles/visualization/source.html>.

## Attribution

Copyright 2011 David Galles, University of San Francisco. Redistributed under
the BSD 2-clause license in `LICENSE.txt`. Changes copyright (c) 2026 The
Regents of the University of California, under the same license.
