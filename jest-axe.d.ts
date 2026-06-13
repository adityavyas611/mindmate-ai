declare module "jest-axe" {
  import type { AxeResults } from "axe-core";

  export function axe(container: Element | Document): Promise<AxeResults>;
  export function toHaveNoViolations(): {
    message: () => string;
    pass: boolean;
  };
}
