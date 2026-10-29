// DATrace course page: ECS 32B. Shown at course.html?ecs32b
//
// Fields (see course.js):
//   course, intro, aside           page heading and the text above the first unit
//   units[]  id, tag, short        anchor and jump-chip text ("3" + "Analysis")
//            label, title, read    unit heading ("Chapter 3", "Analysis") and reading link
//            items[]               sec (string or list), page, name, qualifier, note
//            gaps                  "Not animated yet: ..." line
//   beyond   title, text           closing paragraph of links into the full catalog
// Text may use *italic*, `code` and [text](url).

DATraceCourse({
	course: "ECS 32B",
	intro: "The visualizations that go with one of the textbooks used for the course: " +
		"*[Problem Solving with Algorithms and Data Structures using Python](https://runestone.academy/ns/books/published/pythonds/index.html)* " +
		"by Brad Miller and David Ranum, free on Runestone Academy. " +
		"Each link opens an interactive animation; the note under it says what to try.",
	aside: "Chapters 1 and 2 (Introduction, A Proper Class) review Python and classes, so there is nothing here to animate. " +
		"To step through Python code line by line, use CodeTrace.",

	units: [
		{
			id: "ch3", tag: "3", short: "Analysis",
			label: "Chapter 3", title: "Analysis",
			read: "https://runestone.academy/ns/books/published/pythonds/AlgorithmAnalysis/toctree.html",
			items: [
				{ sec: "3.3", page: "Search.html", name: "Linear and binary search",
				  note: "Pick the Large list and search for the same value both ways. Count the comparisons: that gap is O(*n*) against O(log *n*)." },
				{ sec: "3.3", page: "ComparisonSort.html", name: "Insertion sort vs. merge sort",
				  note: "Run Insertion Sort, Randomize Array, then run Merge Sort. O(*n*²) and O(*n* log *n*) side by side." }
			]
		},
		{
			id: "ch4", tag: "4", short: "Basic Data Structures",
			label: "Chapter 4", title: "Basic Data Structures",
			read: "https://runestone.academy/ns/books/published/pythonds/BasicDS/toctree.html",
			items: [
				{ sec: "4.3–4.5", page: "StackArray.html", name: "Stack: array implementation",
				  note: "The textbook’s `Stack` keeps its items in a Python list and pushes and pops at the end. This is the same design with the array and the top index drawn out." },
				{ sec: ["4.3–4.5", "4.21"], page: "StackLL.html", name: "Stack: linked list implementation",
				  note: "Push adds a node at the head, exactly like `add` on the unordered list of 4.21; pop removes the head node." },
				{ sec: "4.10–4.12", page: "QueueArray.html", name: "Queue: array implementation",
				  note: "A circular array whose head and tail wrap around. In the textbook’s version `insert(0, item)` makes enqueue O(*n*); here both ends are O(1)." },
				{ sec: "4.10–4.12", page: "QueueLL.html", name: "Queue: linked list implementation",
				  note: "Enqueue at the tail, dequeue at the head." }
			],
			gaps: "balanced symbols and base conversion (4.6–4.8), infix and postfix (4.9), deque (4.15–4.17), ordered list (4.22–4.23)."
		},
		{
			id: "ch5", tag: "5", short: "Recursion",
			label: "Chapter 5", title: "Recursion",
			read: "https://runestone.academy/ns/books/published/pythonds/Recursion/toctree.html",
			items: [
				{ sec: "5.2–5.6", page: "RecFact.html", name: "Factorial",
				  note: "Each call pushes a frame onto the call stack and each return pops one: section 5.6, Stack Frames, step by step." },
				{ sec: "5.2–5.6", page: "RecReverse.html", name: "Reversing a string",
				  note: "The same three laws on a string: shrink the problem, recurse, and combine on the way back up." },
				{ sec: "5.9–5.11", page: "RecQueens.html", name: "N-Queens",
				  note: "Backtracking: place a queen, recurse, undo on failure. The same idea as Exploring a Maze (5.11)." },
				{ sec: "5.12", page: "DPChange.html", name: "Making change",
				  note: "The chapter’s own example. Run Change Recursive, Change Memoized and Change Table on the same amount and compare the work. With coins [1, 4, 6, 10], Change Greedy pays 12 as 10 + 1 + 1, where 6 + 6 needs only two coins." },
				{ sec: "5.12", page: "DPFib.html", name: "Fibonacci numbers",
				  note: "Memoization at its smallest: count the calls Fibonacci Recursive makes, then run Fibonacci Memoized." }
			],
			gaps: "Sierpinski triangle (5.8), Tower of Hanoi (5.10), maze (5.11)."
		},
		{
			id: "ch6", tag: "6", short: "Sorting and Searching",
			label: "Chapter 6", title: "Sorting and Searching",
			read: "https://runestone.academy/ns/books/published/pythonds/SortSearch/toctree.html",
			items: [
				{ sec: "6.3–6.4", page: "Search.html", name: "Sequential and binary search",
				  note: "Both searches on a sorted list. Try a value that is not in the list, too." },
				{ sec: "6.5", page: "ClosedHash.html", name: "Hash table: open addressing",
				  note: "Collisions resolved by probing (6.5.2). Start with Linear Probing, the textbook’s choice, and watch clusters form; then compare Quadratic Probing and Double Hashing." },
				{ sec: "6.5", page: "OpenHash.html", name: "Hash table: chaining",
				  note: "Each slot holds a linked list of the keys that hash there, the other strategy in 6.5.2." },
				{ sec: "6.7–6.12", page: "ComparisonSort.html", name: "Bubble, selection, insertion, shell, merge and quick sort",
				  note: "All six of the chapter’s sorts on one page. Randomize Array, then run them one at a time on fresh data and compare the number of steps." }
			]
		},
		{
			id: "ch7", tag: "7", short: "Trees",
			label: "Chapter 7", title: "Trees and Tree Algorithms",
			read: "https://runestone.academy/ns/books/published/pythonds/Trees/toctree.html",
			items: [
				{ sec: "7.8–7.10", page: "Heap.html", name: "Binary heap",
				  note: "A min-heap drawn both as a tree and as the list that stores it (7.10.1). Insert percolates up, Remove Smallest percolates down, and BuildHeap is the `buildHeap` of 7.10.3." },
				{ sec: "7.8–7.10", page: "HeapSort.html", name: "Heap sort",
				  note: "Heap operations put to work: build a heap in the array, then repeatedly move the top to the end." },
				{ sec: "7.11–7.14", page: "BST.html", name: "Binary search tree",
				  note: "Insert, Find and Delete, including the two-child delete. Print walks the tree in order (7.7). Insert 1 through 7 in order to build the unbalanced tree 7.14 warns about." },
				{ sec: "7.15–7.17", page: "AVLtree.html", name: "AVL tree",
				  note: "Insert 1 through 7 here as well: the rotations keep the height logarithmic." }
			],
			gaps: "list-of-lists and nodes-and-references trees, parse trees (7.4–7.6), preorder and postorder traversal (7.7)."
		},
		{
			id: "ch8", tag: "8", short: "Graphs",
			label: "Chapter 8", title: "Graphs and Graph Algorithms",
			read: "https://runestone.academy/ns/books/published/pythonds/Graphs/toctree.html",
			items: [
				{ sec: "8.4–8.5", page: "BFS.html", name: "Adjacency matrix and adjacency list",
				  note: "Every graph page can switch between the drawing, Adjacency List Representation and Adjacency Matrix Representation. The same graph, three ways." },
				{ sec: "8.9–8.10", page: "BFS.html", name: "Breadth-first search",
				  note: "The queue-driven search behind the word ladder, on a random graph." },
				{ sec: "8.15–8.16", page: "DFS.html", name: "Depth-first search",
				  note: "General DFS, as in 8.15." },
				{ sec: "8.17", page: "TopoSortDFS.html", name: "Topological sort", qualifier: "by DFS",
				  note: "The textbook’s method: run DFS and order the vertices by finish time." },
				{ sec: "8.17", page: "TopoSortIndegree.html", name: "Topological sort", qualifier: "by indegree",
				  note: "A second method, not in the book: repeatedly remove a vertex with no incoming edges." },
				{ sec: "8.18", page: "ConnectedComponent.html", name: "Strongly connected components",
				  note: "DFS, transpose the graph, DFS again: the algorithm of 8.18." },
				{ sec: "8.20–8.21", page: "Dijkstra.html", name: "Dijkstra’s algorithm",
				  note: "Shortest paths from one vertex, with the table of known vertices, costs and paths updating as it goes." },
				{ sec: "8.22", page: "Prim.html", name: "Prim’s spanning tree algorithm",
				  note: "A minimum spanning tree grown outward from one vertex." }
			],
			gaps: "word ladder (8.7–8.8), knight’s tour (8.11–8.14)."
		}
	],

	beyond: {
		title: "Beyond the textbook",
		text: "More balanced trees ([red-black](RedBlack.html), [splay](SplayTree.html), [B-trees](BTree.html)), " +
			"string structures ([tries](Trie.html), [suffix trees](SuffixTree.html)), " +
			"more graph algorithms ([Kruskal](Kruskal.html), [Floyd–Warshall](Floyd.html), [disjoint sets](DisjointSets.html)), " +
			"and sorts that don’t compare ([counting](CountingSort.html), [radix](RadixSort.html))."
	}
});
