// Every component a lesson (.mdx) can use without importing it.

import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes, ComponentType } from "react";
import { Link } from "react-router-dom";
import { BroadcastViz } from "../viz/BroadcastViz";
import { ChainRuleGraph } from "../viz/ChainRuleGraph";
import { ConvolutionViz, FeatureMapsViz } from "../viz/CnnViz";
import { ConvGradViz, Im2colViz, PoolingViz, StridePaddingViz } from "../viz/ConvMechanicsViz";
import { CrossEntropyTrainer, LogLossCurve } from "../viz/CrossEntropyViz";
import { DerivativeExplorer } from "../viz/DerivativeExplorer";
import { DigitDemo } from "../viz/DigitDemo";
import { GradientField } from "../viz/GradientField";
import { InitViz, NormalViz } from "../viz/InitViz";
import { LineFitViz } from "../viz/LineFitViz";
import { MatmulStepper } from "../viz/MatmulStepper";
import { MatrixTransformer } from "../viz/MatrixTransformer";
import { BackpropShapesViz, XorNetViz } from "../viz/MLPViz";
import { ActivationViz, NeuronViz } from "../viz/NeuronViz";
import { LearningRateViz, MomentumViz } from "../viz/OptimizerViz";
import { PlaygroundViz } from "../viz/PlaygroundViz";
import { RngQuality, XorshiftViz } from "../viz/RngViz";
import { SamplingViz } from "../viz/SamplingViz";
import { SoftmaxViz } from "../viz/SoftmaxViz";
import { StrideExplorer } from "../viz/StrideExplorer";
import { VectorPlayground } from "../viz/VectorPlayground";
import { MatrixCheck, NumericCheck, Quiz } from "./Checks";
import { ErrorBoundary } from "./ErrorBoundary";
import { Exercise } from "./Exercise";
import { Callout, KeyIdea, Lang, LangName, PerLang, Term, Wide } from "./LessonBits";
import { Tex } from "./RichText";

function A({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) return <Link to={href}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
      {children}
    </a>
  );
}

/** Wrap a lesson component so a failure shows a message in its place instead of breaking the lesson. */
function guard<P extends object>(C: ComponentType<P>, what: string): ComponentType<P> {
  const Guarded = (props: P) => (
    <ErrorBoundary what={what}>
      <C {...props} />
    </ErrorBoundary>
  );
  Guarded.displayName = `Guarded(${C.displayName ?? C.name})`;
  return Guarded;
}

const figures = {
  VectorPlayground,
  MatrixTransformer,
  MatmulStepper,
  StrideExplorer,
  BroadcastViz,
  DerivativeExplorer,
  ChainRuleGraph,
  GradientField,
  DigitDemo,
  SamplingViz,
  SoftmaxViz,
  LogLossCurve,
  CrossEntropyTrainer,
  XorshiftViz,
  RngQuality,
  NormalViz,
  InitViz,
  LineFitViz,
  LearningRateViz,
  MomentumViz,
  ActivationViz,
  NeuronViz,
  XorNetViz,
  BackpropShapesViz,
  PlaygroundViz,
  ConvolutionViz,
  FeatureMapsViz,
  StridePaddingViz,
  PoolingViz,
  ConvGradViz,
  Im2colViz,
};

export const mdxComponents: MDXComponents = {
  a: A,
  Exercise: guard(Exercise, "this exercise"),
  Quiz,
  NumericCheck,
  MatrixCheck,
  Lang,
  LangName,
  PerLang,
  Term,
  Callout,
  KeyIdea,
  Wide,
  Tex,
  ...Object.fromEntries(Object.entries(figures).map(([name, C]) => [name, guard(C as ComponentType<object>, "this figure")])),
};
