# TEACH-ME-AI

An interactive web app that teaches the math behind AI from first principles. The learner then uses it to build a convolutional neural network from scratch, in their choice of Python, Rust or C++, that classifies MNIST handwritten digits.

## Guiding principles

- **From scratch means from scratch.** No NumPy, PyTorch, `ndarray` or Eigen. Only the standard library. The learner writes their own matrix and tensor type and everything built on top of it.
- **Every concept comes in three forms:** an explanation, an interactive visualization the learner can play with, and code the learner writes.
- **Code accumulates.** Each exercise adds a tested function to the learner's own library. The final CNN is put together from code they already wrote.
- **Pick your language once.** At the start, the learner chooses Python, Rust or C++, and the whole course is taught in that language. The math lessons and visualizations are shared; the exercises, starter code, tests and language notes are written for each language.

---

## 1. Curriculum

### Module 0: Orientation
- Demo of the end goal: draw a digit and a trained CNN predicts it
- **Choose your language:** Python, Rust or C++, with a short description of what each one is like for this course (Python: easiest to write but slowest to train; Rust: fast and memory-safe but stricter; C++: fast but manual memory management)
- Course roadmap and how the "build your own library" approach works
- Optional refresher covering just enough of the chosen language for the course

### Module 1: Linear Algebra
- Scalars and vectors; vector addition and scaling; dot product; norms
- Matrices; matrix-vector and matrix-matrix multiplication; transpose; identity
- Linear transformations seen as geometry
- Tensors (3D/4D), shapes, row-major memory layout, strides, reshape, flatten
- Element-wise ops and broadcasting
- **Build:** vector and matrix functions (add, scale, dot, norm, matrix-vector and matrix-matrix products, transpose, element-wise ops, broadcasting) and row-major tensor indexing (strides, flat index, flatten, reshape). A flat-storage `Tensor` type comes with the CNN modules.

### Module 2: Calculus
- Derivatives as slope; limits; derivative rules
- The chain rule (the core idea behind backprop)
- Partial derivatives, gradients, and Jacobians where needed
- Numerical differentiation (finite differences)
- **Build:** numerical gradient function, reused later for gradient checking

### Module 3: Probability & Statistics
- Distributions, expectation, variance
- Softmax, log-probabilities, cross-entropy
- Maximum likelihood, which explains why cross-entropy is the loss to use
- Weight initialization (uniform, normal, Xavier/He)
- **Build:** a seeded PRNG such as xorshift or PCG (Rust's standard library has no RNG). Every track builds the same one, so a given seed gives reproducible results that the course's tests can check.

### Module 4: Optimization
- Loss functions (MSE, cross-entropy)
- Gradient descent, learning rate, SGD, mini-batches
- Momentum (Adam as a bonus)
- **Build:** loss functions and an SGD optimizer

### Module 5: Neural Networks
- The neuron and the perceptron; activation functions (sigmoid, tanh, ReLU)
- Multi-layer perceptron forward pass
- Computational graphs and backpropagation
- Gradient checking: analytic gradients compared against numerical ones
- **Milestone:** train an MLP on MNIST (about 97%)

### Module 6: Convolutional Neural Networks
- What convolution does (1D, then 2D); kernels, stride, padding, output-size formula
- Multi-channel convolution and feature maps
- Pooling (max and average)
- Backprop through convolution and pooling layers
- im2col: rewriting convolution as matrix multiplication
- Architecture: Conv → ReLU → Pool → … → Flatten → Dense → Softmax

### Module 7: Capstone, MNIST CNN
- Parse the IDX binary format (byte handling and endianness in each language)
- Normalization, train/validation split, shuffling, batching
- Assemble, train and evaluate the CNN (target: 98–99%)
- Save and load model weights

---

## 2. Interactive Math Visualizations

- **Vector playground:** drag vectors to see addition, dot product and projection update live
- **Matrix transformer:** edit the entries of a 2×2 matrix and watch a grid stretch, rotate and shear
- **Matmul stepper:** step through a matrix product, with each row × column pair highlighted
- **Derivative explorer:** a tangent line on a curve; shrink *h* to watch the finite difference converge
- **Gradient descent on a loss surface:** a 2D contour or 3D view with adjustable learning rate (you can watch it diverge)
- **Computational graph:** values flow forward through the nodes and gradients flow back
- **Softmax & cross-entropy sliders:** move the logits and watch the probabilities and loss change
- **Neuron playground:** adjust weights and bias to move a decision boundary
- **Convolution animator:** a kernel slides over a real MNIST digit and builds the feature map live; edit the kernel (edge detect, blur, sharpen)
- **Pooling animator:** see max and average pooling on a feature map
- **Shape tracer:** tensor shapes shown at every layer of the network

---

## 3. Coding Workspace

- In-browser code editor (Monaco) set to the learner's chosen language
- Starter code with function signatures and `TODO`s, written for the chosen language
- **Run** shows stdout/stderr, with Rust/C++ compiler errors shown inline
- **Submit** runs a hidden test suite and reports pass/fail per test with expected vs. actual values
- Hints in stages (nudge, then approach, then near-solution); the reference solution unlocks after a few attempts
- Reset to starter code and view your past submissions
- **My Library:** browse every function you have written so far

---

## 4. Grading & Verification

- Unit tests per exercise. Test data is written once as shared JSON fixtures and run against whichever language the learner chose, so each exercise only needs one set of test cases.
- Floating-point comparison with a tolerance
- Built-in gradient checker for every backprop exercise
- Performance checks on later exercises (e.g., a conv layer must finish within N seconds)
- Plain-language diagnostics for shape mismatches ("expected 8×26×26, got 26×26×8")

---

## 5. MNIST Capstone Features

- **Dataset viewer:** browse digits and look at their raw 28×28 pixel values
- **Live training dashboard:** loss and accuracy curves streamed from the learner's running code, with epoch and batch progress
- **Hyperparameter controls:** learning rate, batch size, epochs, number of filters, kernel size
- **Evaluation:** test accuracy, an interactive confusion matrix, and a gallery of misclassified digits
- **Filter & feature-map visualizer:** see what each learned filter responds to for a chosen input
- **Draw-a-digit canvas:** draw with mouse or touch; the drawing is downscaled to 28×28, run through *the learner's own trained model*, and shown with a probability bar chart

---

## 6. Language Tracks

- The language is chosen once, during onboarding, and the course is taught in that language from start to finish
- Each language is a separate track with its own progress, code and trained models
- No switching languages mid-course. To learn a second language, the learner starts a new track from the beginning (their first track's progress is kept).
- Per-lesson notes for the chosen language, for example:
  - Rust: ownership and borrowing for tensors, slices, `Vec<f32>` layout
  - C++: memory layout, RAII, `std::vector`, references vs. copies
  - Python: why loops are slow, and lists vs. `array`
- Course pacing adjusted per language (e.g., the Python track trains on a smaller slice of MNIST so training times stay reasonable)

---

## 7. Learner Experience & Progress

- Roadmap / skill tree with prerequisites, so modules unlock in order
- Progress tracked per lesson
- Concept checks: multiple choice, numeric answers, "predict the output shape"
- Pen-and-paper problems with answer checking (e.g., "compute this 2×2 matmul by hand")
- Math rendering with KaTeX
- Glossary with hover definitions
- Notes and bookmarks
- Light/dark mode
- Accounts, or local-first storage with optional sync

---

## 8. Platform & Infrastructure

- **Sandboxed code execution:** containers with Python 3, a Rust toolchain (no external crates), and g++/clang (C++17/20); no network access; CPU, memory and time limits
- Build caching so Rust/C++ compiles stay fast
- **Long-running jobs** for training: background execution, with logs and metrics streamed over WebSocket
- Lessons authored as Markdown/MDX, with exercise definitions (starter code, tests, hints per language) kept as data so new lessons are easy to add
- Persistence for learner code, progress and trained model weights

---

## Optional / Later

- AI tutor that explains failing tests and answers questions about the current lesson
- Build a tiny reverse-mode autograd engine
- Adam, batch normalization, dropout
- Bonus performance track: SIMD, multithreading, cache-friendly loops (Rust/C++)
- Compile the learner's Rust/C++ model to WebAssembly so the draw-a-digit demo runs fully in the browser
- Extras for learners who finish more than one track: compare their own implementations side by side, benchmark them against each other, and load weights trained in one language into another

---

## Suggested Build Order

1. **MVP:** language picker, plus Modules 1–2 with visualizations and the Python track only
2. Modules 3–5 ending in the MLP-on-MNIST milestone, plus the draw-a-digit canvas
3. Rust and C++ tracks: starter code, tests and language notes for Modules 1–5
4. Modules 6–7 CNN capstone and training dashboard, for all three tracks

## Decisions

- **Learner's language:** chosen once at the start (Python, Rust or C++); the whole course is in that language
- **App stack:** Python (FastAPI) backend, TypeScript + React frontend, Monaco editor, KaTeX, SVG/canvas for visualizations, SQLite for progress
- **Where code runs:** on the server, in a throwaway Docker container per run (no network, read-only filesystem, resource limits)
- **Audience:** built for multiple users (accounts, sessions, sandboxing), currently run by me

## Status (updated 2026-10-17)

**Built**
- Accounts, language tracks (separate progress per language), lesson unlocking, progress tracking
- Sandboxed runner for all three languages: generated test harnesses, hidden tests, friendly compile/crash/timeout messages, shared JSON test fixtures
- Coding workspace: Monaco editor, Run/Submit, autosaved drafts, staged hints, reference solution after 3 submissions, submission history, My Library page
- Modules 0–3: 18 lessons, 36 exercises (each in Python, Rust and C++), quizzes and hand-calculation checks, glossary
- Visualizations: vector playground (add / dot / scale), matrix transformer, matmul stepper, stride explorer, broadcasting, derivative explorer, computational-graph backprop, gradient field with gradient descent, sampling and the law of large numbers, softmax with temperature, −ln p loss curve, cross-entropy gradient-step trainer, xorshift bit stepper, generator quality (pairs test), Box–Muller, deep-network initialization lab, draw-a-digit CNN demo
- Light/dark mode, mobile layout

**Not built yet**
- Modules 4–7 (shown as "coming soon" on the roadmap), including the training dashboard, dataset viewer and capstone features
- Running learner code for long training jobs (needs background jobs and streaming metrics)
- Compile caching for Rust/C++ (single-file compiles currently take under a second)
