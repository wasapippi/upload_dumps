import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Surfboard Pages + MySQL</h1>
      <ul>
        <li><Link href="/platforms">Platforms</Link></li>
        <li><Link href="/commands">Commands</Link></li>
        <li><Link href="/links">Links</Link></li>
      </ul>
    </main>
  );
}
