import React from "react";

export default function MockLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
