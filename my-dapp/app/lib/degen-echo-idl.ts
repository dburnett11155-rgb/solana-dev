export const PROGRAM_ID = "2RUvH2vVqDtMPXPaGV58C2F2mT1SpDq47teyoJABhDgK";

export const IDL = {
  address: "2RUvH2vVqDtMPXPaGV58C2F2mT1SpDq47teyoJABhDgK",
  version: "0.1.0",
  name: "degen_echo",
  instructions: [
    {
      name: "createRound",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "roundVault", isMut: true, isSigner: false },
        { name: "rakeWallet", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "startPrice", type: "u64" },
        { name: "endTime", type: "i64" },
        { name: "hour", type: "u8" }
      ]
    },
    {
      name: "placeBet",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "bet", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "roundVault", isMut: true, isSigner: false },
        { name: "rakeWallet", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "tier", type: "u8" },
        { name: "amount", type: "u64" }
      ]
    },
    {
      name: "settleRound",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true }
      ],
      args: [
        { name: "endPrice", type: "u64" }
      ]
    },
    {
      name: "claimWinnings",
      accounts: [
        { name: "round", isMut: true, isSigner: false },
        { name: "bet", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "roundVault", isMut: true, isSigner: false },
        { name: "streak", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "initStreak",
      accounts: [
        { name: "streak", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "Round",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "rakeWallet", type: "publicKey" },
          { name: "startPrice", type: "u64" },
          { name: "endPrice", type: "u64" },
          { name: "startTime", type: "i64" },
          { name: "endTime", type: "i64" },
          { name: "hour", type: "u8" },
          { name: "totalPot", type: "u64" },
          { name: "bigPumpTotal", type: "u64" },
          { name: "smallPumpTotal", type: "u64" },
          { name: "stagnateTotal", type: "u64" },
          { name: "smallDumpTotal", type: "u64" },
          { name: "bigDumpTotal", type: "u64" },
          { name: "winningEffectiveTotal", type: "u64" },
          { name: "settled", type: "bool" },
          { name: "winningTier", type: "u8" },
          { name: "isRollover", type: "bool" }
        ]
      }
    },
    {
      name: "Bet",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "publicKey" },
          { name: "round", type: "publicKey" },
          { name: "tier", type: "u8" },
          { name: "amount", type: "u64" },
          { name: "timestamp", type: "i64" },
          { name: "isEarly", type: "bool" },
          { name: "countsForStreak", type: "bool" },
          { name: "claimed", type: "bool" }
        ]
      }
    },
    {
      name: "Streak",
      type: {
        kind: "struct",
        fields: [
          { name: "wallet", type: "publicKey" },
          { name: "currentStreak", type: "u8" },
          { name: "totalWins", type: "u32" },
          { name: "jackpotPending", type: "bool" }
        ]
      }
    }
  ],
  errors: [
    { code: 6000, name: "InvalidTier", msg: "Tier must be 1-5" },
    { code: 6001, name: "InvalidAmount", msg: "Bet amount must be greater than 0" },
    { code: 6002, name: "RoundAlreadySettled", msg: "Round has already been settled" },
    { code: 6003, name: "RoundNotSettled", msg: "Round has not been settled yet" },
    { code: 6004, name: "BettingClosed", msg: "Betting is closed for this round" },
    { code: 6005, name: "AlreadyClaimed", msg: "Already claimed winnings" },
    { code: 6006, name: "NotAWinner", msg: "Not a winner this round" },
    { code: 6007, name: "RoundWasRollover", msg: "Round was a rollover - no winners" }
  ]
};
