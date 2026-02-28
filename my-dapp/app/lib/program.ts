import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
  return new Program(IDL as any, new PublicKey(PROGRAM_ID), provider);
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

export async function placeBetOnChain(
  program: Program,
  userPubkey: PublicKey,
  tier: string,
  amountSol: number,
  hour: number,
  date: string
) {
  const roundPDA = getRoundPDA(hour, date);
  const vaultPDA = getRoundVaultPDA(roundPDA);
  const betPDA = getBetPDA(roundPDA, userPubkey);
  const amountLamports = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));

  const tx = await program.methods
    .placeBet(tierToNumber(tier), amountLamports)
    .accounts({
      round: roundPDA,
      bet: betPDA,
      user: userPubkey,
      roundVault: vaultPDA,
      rakeWallet: RAKE_WALLET,
      systemProgram: web3.SystemProgram.programId
    })
    .rpc();

  return tx;
}

export async function claimWinningsOnChain(
  program: Program,
  userPubkey: PublicKey,
  hour: number,
  date: string
) {
  const roundPDA = getRoundPDA(hour, date);
  const vaultPDA = getRoundVaultPDA(roundPDA);
  const betPDA = getBetPDA(roundPDA, userPubkey);
  const streakPDA = getStreakPDA(userPubkey);

  const tx = await program.methods
    .claimWinnings()
    .accounts({
      round: roundPDA,
      bet: betPDA,
      user: userPubkey,
      roundVault: vaultPDA,
      streak: streakPDA,
      systemProgram: web3.SystemProgram.programId
    })
    .rpc();

  return tx;
}
