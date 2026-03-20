type Props = {
  status: "success" | "failure";
};

export function ResultScreen({ status }: Props) {
  return (
    <div className={`panel min-h-60 ${status === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      {status === "success" ? "Access granted" : "Access denied"}
    </div>
  );
}

