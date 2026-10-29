// DATrace course page: ECS 124. Shown at course.html?ecs124
//
// Organized by unit (see course.js). Each unit has topics:
//   { title, viz: [{ page: "SuffixTree.html", name: "Suffix tree" }, { planned: "Ukkonen's algorithm" }] }
// and { part: "Part A · Characters" } rows for sub-headings.

DATraceCourse({
	course: "ECS 124",
	subtitle: "Theory and Practice of Bioinformatics",
	intro: "Visualizations for the course, unit by unit; a ▶ link opens an interactive animation.",
	aside: "Unit 0, Introduction and Background, sets up the biology and notation the rest of the course uses: " +
		"the central dogma, transcription, translation and gene structure, and sequences as strings over an alphabet.",

	units: [
		{
			id: "u1", tag: "1", short: "Exact Matching", label: "Unit 1", title: "Exact Matching and Algorithm Analysis",
			topics: [
				{ title: "The exact matching problem; naive matching and its worst case", viz: { planned: "Naive exact matching" } },
				{ title: "Fundamental preprocessing and the Z-algorithm; the first linear-time matcher", viz: { planned: "Z-algorithm" } },
				{ title: "Boyer–Moore: bad-character rule, good-suffix rule, preprocessing", viz: { planned: "Boyer–Moore" } },
				{ title: "Knuth–Morris–Pratt and the failure function", viz: { planned: "Knuth–Morris–Pratt" } },
				{ title: "Fast versus slow algorithms; big-O notation", viz: { page: "Search.html", name: "Linear vs. binary search" } }
			]
		},
		{
			id: "u2", tag: "2", short: "Alignment", label: "Unit 2", title: "Sequence Alignment",
			topics: [
				{ title: "The change problem and Manhattan tourist as DP on-ramps",
				  viz: [{ page: "DPChange.html", name: "Making change" }, { planned: "Manhattan tourist" }] },
				{ title: "Alignment as longest path in a DAG; topological order",
				  viz: [{ page: "TopoSortDFS.html", name: "Topological sort" }, { planned: "Longest path in a DAG" }] },
				{ title: "Edit distance, alignments, longest common subsequence",
				  viz: [{ page: "DPLCS.html", name: "Longest common subsequence" }, { planned: "Edit distance" }] },
				{ title: "Global alignment (Needleman–Wunsch); scoring matrices",
				  viz: { planned: "Needleman–Wunsch" } },
				{ title: "Local alignment (Smith–Waterman)", viz: { planned: "Smith–Waterman" } },
				{ title: "End-gap-free alignment and approximate occurrences of *P* in *T*" },
				{ title: "Affine gap penalties", viz: { planned: "Affine gap alignment" } },
				{ title: "Space-efficient alignment by divide and conquer", viz: { planned: "Linear-space alignment" } },
				{ title: "Profiles and profile alignment" },
				{ title: "Sum-of-pairs multiple alignment; exact multidimensional DP" },
				{ title: "Iterative pairwise (progressive) alignment and the guide tree" }
			]
		},
		{
			id: "u3", tag: "3", short: "Search and Indexing", label: "Unit 3", title: "Database Search and Indexing",
			topics: [
				{ title: "Heuristic similarity search and filtration" },
				{ title: "Approximate pattern matching" },
				{ title: "BLAST: comparing a sequence against a database", viz: { planned: "BLAST seed and extend" } },
				{ title: "Tries and TrieMatching; the suffix trie and its space problem",
				  viz: [{ page: "Trie.html", name: "Trie" }, { page: "RadixTree.html", name: "Compressed trie" }] },
				{ title: "Suffix trees: definition and applications",
				  viz: { page: "SuffixTree.html", name: "Suffix tree" } },
				{ title: "Ukkonen’s linear-time construction with suffix links",
				  viz: { planned: "Ukkonen’s algorithm" } },
				{ title: "Longest common substring; all-pairs suffix-prefix matching",
				  viz: { page: "SuffixArray.html", name: "Longest common substring" } },
				{ title: "Suffix arrays and their relationship to suffix trees",
				  viz: { page: "SuffixArray.html", name: "Suffix array" } },
				{ title: "The Burrows–Wheeler transform, first-last property, inversion",
				  viz: { planned: "Burrows–Wheeler transform" } },
				{ title: "BWMatching, BetterBWMatching, checkpoint arrays", viz: { planned: "BWMatching" } }
			]
		},
		{
			id: "u4", tag: "4", short: "Assembly", label: "Unit 4", title: "Genome Assembly",
			topics: [
				{ title: "The string reconstruction problem; shortest superstring and intractability" },
				{ title: "Overlap graphs and Hamiltonian paths", viz: { planned: "Overlap graph" } },
				{ title: "de Bruijn graphs and Eulerian paths; Euler’s theorem", viz: { planned: "de Bruijn graph" } },
				{ title: "EulerianCycle and EulerianPath as implementable algorithms", viz: { planned: "Eulerian cycle" } },
				{ title: "Read-pairs and paired de Bruijn graphs" },
				{ title: "Fragment assembly on real data: repeats, errors, coverage" }
			]
		},
		{
			id: "u5", tag: "5", short: "Phylogenetics", label: "Unit 5", title: "Phylogenetics",
			topics: [
				{ part: "Part A · Characters" },
				{ title: "Binary character matrices; the perfect phylogeny problem", viz: { planned: "Perfect phylogeny" } },
				{ title: "The compatibility condition and the sort-and-build algorithm" },
				{ title: "Character-based reconstruction; maximum parsimony" },
				{ title: "Small parsimony and Sankoff’s algorithm", viz: { planned: "Sankoff’s algorithm" } },
				{ title: "Large parsimony; nearest-neighbor interchange", viz: { planned: "Nearest-neighbor interchange" } },
				{ part: "Part B · Distances" },
				{ title: "Distance matrices; additivity and the four-point condition" },
				{ title: "The limb length theorem and AdditivePhylogeny", viz: { planned: "AdditivePhylogeny" } },
				{ title: "Least-squares fitting for non-additive matrices" },
				{ title: "Ultrametric trees and UPGMA", viz: { planned: "UPGMA" } },
				{ title: "Neighbor joining", viz: { planned: "Neighbor joining" } }
			]
		},
		{
			id: "u6", tag: "6", short: "Machine Learning", label: "Unit 6", title: "Machine Learning in Bioinformatics",
			topics: [
				{ title: "Gene expression matrices; what makes a clustering good" },
				{ title: "k-centers, Lloyd’s algorithm, k-means++ initialization, squared error distortion",
				  viz: { planned: "Lloyd’s algorithm (k-means)" } },
				{ title: "Hierarchical clustering", viz: { planned: "Hierarchical clustering" } },
				{ title: "Soft k-means and expectation maximization", viz: { planned: "Soft k-means" } },
				{ title: "CG-islands and the fair bet casino; HMM formalism" },
				{ title: "The decoding problem; Viterbi as longest path", viz: { planned: "Viterbi algorithm" } },
				{ title: "The forward algorithm and outcome likelihood", viz: { planned: "Forward algorithm" } },
				{ title: "Pair HMMs; pairwise alignment via HMM" },
				{ title: "Profile HMM alignment" },
				{ title: "Baum–Welch as expectation maximization" }
			]
		}
	]
});
