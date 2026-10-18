// Every component a lesson (.mdx) can use without importing it.

import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { BroadcastViz } from "../viz/BroadcastViz";
import { ChainRuleGraph } from "../viz/ChainRuleGraph";
import { DerivativeExplorer } from "../viz/DerivativeExplorer";
import { DigitDemo } from "../viz/DigitDemo";
import { GradientField } from "../viz/GradientField";
import { MatmulStepper } from "../viz/MatmulStepper";
import { MatrixTransformer } from "../viz/MatrixTransformer";
import { StrideExplorer } from "../viz/StrideExplorer";
import { VectorPlayground } from "../viz/VectorPlayground";
import { MatrixCheck, NumericCheck, Quiz } from "./Checks";
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

export const mdxComponents: MDXComponents = {
  a: A,
  Exercise,
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
  VectorPlayground,
  MatrixTransformer,
  MatmulStepper,
  StrideExplorer,
  BroadcastViz,
  DerivativeExplorer,
  ChainRuleGraph,
  GradientField,
  DigitDemo,
};
