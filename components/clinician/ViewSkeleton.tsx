import type { ReactNode } from "react";
import type { Audience } from "./view-config";

// Clinician and saved views share the same module grid. Patient content uses
// the same outer skeleton while retaining its own simpler inner layout.
export function ViewSkeleton({ variant, children, footer }: { variant: Audience; children: ReactNode; footer?: ReactNode }) {
  if (variant === "patient") {
    return <div className="patient-view">{children}{footer}</div>;
  }

  return (
    <div className="view-skeleton">
      <div className="board">{children}</div>
      {footer}
    </div>
  );
}
