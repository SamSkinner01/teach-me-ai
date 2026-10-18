// Definitions shown when hovering a <Term> in a lesson, and on the glossary page.

export const GLOSSARY: Record<string, string> = {
  "box-muller transform":
    "A way to turn two independent uniform random numbers u₁, u₂ into two independent standard normal ones: r = √(−2 ln u₁), θ = 2πu₂, then r·cos θ and r·sin θ.",
  "cross-entropy":
    "The standard loss for classifiers: −ln of the probability the model gave to the correct class. It's 0 for a perfect, confident prediction and grows without limit as that probability approaches 0.",
  "expected value":
    "The probability-weighted average of a random variable's values, E[X] = Σ xᵢ pᵢ. It's what the average of many samples settles towards.",
  "fan-in": "The number of inputs feeding into a neuron (for a layer with weight matrix W, the number of columns).",
  "he initialization":
    "Drawing initial weights from a normal distribution with variance 2 / fan-in. It keeps the spread of activations steady through layers of ReLUs.",
  "law of large numbers":
    "The average of many independent samples of a random variable gets closer and closer to its expected value as the number of samples grows.",
  likelihood:
    "How probable the observed data is under a model with particular parameters. Training by maximum likelihood means choosing the parameters that make the data most probable.",
  "log-sum-exp":
    "ln(Σ eˣⁱ), computed stably as m + ln Σ e^(xᵢ − m) where m is the largest xᵢ. It appears whenever you take the log of a softmax.",
  logit: "A raw, unnormalized score output by a classifier, before softmax turns the scores into probabilities.",
  "normal distribution":
    "The bell-shaped distribution N(μ, σ²), with mean μ and standard deviation σ. About 68% of samples fall within one σ of the mean, and 95% within two.",
  "one-hot":
    "A vector of zeros with a single 1 marking one category, for example the label 3 out of 10 classes is (0, 0, 0, 1, 0, 0, 0, 0, 0, 0).",
  "probability distribution":
    "A description of which values a random variable can take and how likely each one is. For a discrete variable, a list of values and probabilities that are non-negative and sum to 1.",
  "pseudo-random number generator":
    "A deterministic algorithm whose outputs look random. Starting it from the same seed always reproduces the same sequence, which makes experiments repeatable.",
  "random variable": "A number whose value is decided by chance, such as the result of rolling a die.",
  seed: "The starting state of a pseudo-random number generator. The same seed always produces the same sequence of numbers.",
  softmax:
    "The function that turns a vector of scores z into probabilities: softmax(z)ᵢ = e^zᵢ / Σⱼ e^zⱼ. Every output is positive, they sum to 1, and larger scores get larger probabilities.",
  "standard deviation":
    "The square root of the variance. It measures spread in the same units as the data itself.",
  variance:
    "The average squared distance of a random variable from its mean, Var[X] = E[(X − μ)²]. Larger variance means more spread.",
  "vanishing gradient":
    "When gradients get multiplied by small factors layer after layer, so they shrink towards zero and the early layers of a deep network barely learn.",
  xor: "Exclusive or: a bitwise operation that outputs 1 where its two inputs differ and 0 where they match.",
  "activation function":
    "A non-linear function applied to a neuron's output, such as sigmoid or ReLU. Without it, stacking layers would collapse into a single linear transformation.",
  backpropagation:
    "The algorithm that computes the gradient of the loss with respect to every weight in a network by applying the chain rule backwards, from the loss to the inputs.",
  "basis vector":
    "One of the unit vectors along the axes, like î = (1, 0) and ĵ = (0, 1) in 2D. The columns of a matrix are where it sends the basis vectors.",
  bias: "A learned number added to a neuron's weighted sum. It shifts the neuron's output so it doesn't have to pass through zero.",
  broadcasting:
    "Combining arrays of different shapes by stretching the smaller one along the missing axes, for example adding one bias vector to every row of a matrix.",
  "chain rule":
    "The rule for differentiating a function of a function: the derivative of f(g(x)) is f'(g(x)) · g'(x). Multiply the local derivatives along the chain.",
  cnn: "Convolutional neural network: a network whose early layers slide small learned filters across an image to detect local patterns like edges and strokes.",
  convolution:
    "Sliding a small grid of weights (a kernel) across an image and taking a weighted sum at every position. It produces a feature map.",
  derivative:
    "The instantaneous rate of change of a function: the slope of its graph at a point. Written f'(x) or df/dx.",
  determinant:
    "For a 2×2 matrix, the factor by which it scales areas. A negative determinant means the transformation flips orientation; zero means it squashes space flat.",
  "dot product":
    "a · b = a₁b₁ + a₂b₂ + … + aₙbₙ. It measures how much two vectors point the same way: |a||b|cos θ.",
  "element-wise":
    "An operation applied independently to each pair of matching entries, so the inputs and output all have the same shape.",
  "finite difference":
    "Approximating a derivative by evaluating the function at nearby points, like (f(x + h) − f(x)) / h for a small step h.",
  gradient:
    "The vector of all partial derivatives of a function. It points in the direction of steepest increase, and its length is how steep that is.",
  "gradient check":
    "Comparing a gradient computed by hand (or by backprop) against a numerical estimate from finite differences, to catch bugs.",
  "gradient descent":
    "Minimizing a function by repeatedly taking small steps in the direction opposite to its gradient.",
  "hadamard product": "The element-wise product of two matrices of the same shape: (A ∘ B)ᵢⱼ = Aᵢⱼ · Bᵢⱼ.",
  "identity matrix":
    "The square matrix with 1s on the diagonal and 0s elsewhere. Multiplying by it leaves any vector or matrix unchanged.",
  "linear transformation":
    "A function on vectors that keeps grid lines straight, parallel and evenly spaced, with the origin fixed. Every one can be written as a matrix.",
  loss: "A single number measuring how wrong a model's predictions are. Training means adjusting the weights to make it smaller.",
  matrix: "A rectangular grid of numbers with rows and columns. An m×n matrix has m rows and n columns.",
  "matrix multiplication":
    "Combining an n×k matrix A and a k×m matrix B into an n×m matrix whose entry (i, j) is the dot product of row i of A with column j of B.",
  mnist:
    "A classic dataset of 70,000 handwritten digits, each a 28×28 grayscale image labelled 0–9. The standard first benchmark for image classifiers.",
  neuron:
    "The basic unit of a neural network: it takes a weighted sum of its inputs, adds a bias, and passes the result through an activation function.",
  norm: "The length of a vector. The Euclidean norm is ||v|| = √(v₁² + v₂² + … + vₙ²).",
  "partial derivative":
    "The derivative of a multi-variable function with respect to one variable, holding all the others fixed. Written ∂f/∂x.",
  "row-major":
    "A memory layout where the elements of each row are stored next to each other, row after row. Used by C, C++, Rust and NumPy by default.",
  scalar: "A single number, as opposed to a vector or matrix.",
  shape: "The size of a tensor along each of its axes. A batch of 32 MNIST images has shape [32, 1, 28, 28].",
  sigmoid:
    "The S-shaped function σ(x) = 1 / (1 + e⁻ˣ). It squashes any number into the range (0, 1), and its derivative is σ(x)(1 − σ(x)).",
  stride:
    "How many elements to skip in flat memory to move one step along an axis of a tensor. For a row-major 2×3 matrix the strides are [3, 1].",
  tensor:
    "A multi-dimensional array of numbers. A scalar is a 0-D tensor, a vector is 1-D, a matrix is 2-D, and a stack of colour images is 4-D.",
  transpose: "Flipping a matrix over its diagonal so rows become columns: (Aᵀ)ᵢⱼ = Aⱼᵢ.",
  vector:
    "An ordered list of numbers. Geometrically it's an arrow from the origin; in machine learning it's often a data point or a list of weights.",
  weight: "A learned number that scales one input of a neuron. Training a network means finding good weights.",
};

export function lookupTerm(term: string): string | undefined {
  return GLOSSARY[term.toLowerCase()];
}
