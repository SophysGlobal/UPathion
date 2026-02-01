interface DividerProps {
  text: string;
}

const Divider = ({ text }: DividerProps) => {
  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 h-px bg-border" />
      <span className="text-sm text-muted-foreground">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

export default Divider;
