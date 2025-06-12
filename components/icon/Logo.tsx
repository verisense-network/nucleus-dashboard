import Link from "next/link"
import Image from "next/image"

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <Image src="/verisense-logo.svg" alt="Verisense" width={40} height={40} />
    </Link>
  )
}
