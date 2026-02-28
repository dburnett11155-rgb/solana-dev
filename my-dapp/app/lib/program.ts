import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IDL, PROGRAM_ID } from "./degen-echo-idl";

export const RAKE_WALLET = new PublicKey("9pWyRYfKahQZPTnNMcXhZDDsUV75mHcb2ZpxGqzZsHnK");
export const AUTHORITY_WALLET = new PublicKey("HSW5Ejp3jy6VzitnWDEoXa39ZpvP2Zx6E4f6hqL9f9Ab");

const TIER_MAP: Record<string, number> = {
  bigpump: 1,
  smallpump: 2,
  stagnate: 3,
  smalldump: 4,
  bigdump: 5
};

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, provider);
}

export function getRoundPDA(hour: number, date: string) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round"), Buffer.from(date), Buffer.from([hour])],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

export function getRoundVaultPDA(roundPDA: PublicKey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), roundPDA.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

export function getBetPDA(roundPDA: PublicKey, userPubkey: PublicKey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), roundPDA.toBuffer(), userPubkey.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

export function getStreakPDA(userPubkey: PublicKey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("streak"), userPubkey.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
  return pda;
}

export function tierToNumber(tier: string): number {
  return TIER_MAP[tier] || 0;
}

export function numberToTier(n: number): string {
  return Object.keys(TIER_MAP).find(k => TIER_MAP[k] === n) || "";
}
