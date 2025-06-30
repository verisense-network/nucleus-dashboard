import Image from "next/image"

export default function Logo() {
  return <>
    <Image src="/verisense-logo.svg" className="hidden md:block" alt="Verisense" width={180} height={50} />
    <Image src="/verisense-logo-square.svg" className="block md:hidden" alt="Verisense" width={50} height={50} />
  </>
}
