import React from "react";

export function Table({ headers = [], children, emptyMessage = "No records found.", className = "" }) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-xs ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            {headers.map((h, idx) => (
              <th key={idx} className="py-3.5 px-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={headers.length || 1} className="py-8 text-center text-muted-foreground font-mono text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = "", onClick }) {
  return (
    <tr 
      onClick={onClick}
      className={`hover:bg-muted/30 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "" }) {
  return <td className={`py-3.5 px-4 align-middle ${className}`}>{children}</td>;
}
