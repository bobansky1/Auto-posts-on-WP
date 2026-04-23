interface Props {
  message: string;
}

export default function ErrorPanel({ message }: Props) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
      <p className="font-semibold text-red-800">Error</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}
