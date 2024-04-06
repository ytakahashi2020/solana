import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  NONCE_ACCOUNT_LENGTH,
  ComputeBudgetProgram,
  NonceAccount,
} from "@solana/web3.js";

// Playground wallet
const payer = pg.wallet.keypair;

// Connection to devnet cluster
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Transaction signature returned from sent transaction
let transactionSignature: string;

// Generate new keypair for Mint Account
const nonceKeypair = Keypair.generate();
// Address for Mint Account
const nonceAddress = nonceKeypair.publicKey;
// Decimals for Mint Account
const decimals = 2;
// Authority that can mint new tokens
const nonceAuthority = pg.wallet.publicKey;

// Size of Mint Account with extension
// const mintLen = getMintLen([ExtensionType.MintCloseAuthority]);
// Minimum lamports required for Mint Account
const lamports = await connection.getMinimumBalanceForRentExemption(
  NONCE_ACCOUNT_LENGTH
);

// Instruction to invoke System Program to create new account
const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: payer.publicKey, // Account that will transfer lamports to created account
  newAccountPubkey: nonceAddress, // Address of the account to create
  space: NONCE_ACCOUNT_LENGTH, // Amount of bytes to allocate to the created account
  lamports: lamports, // Amount of lamports transferred to created account
  programId: SystemProgram.programId, // Program assigned as owner of created account
});

// initialize nonce account
const initializeAccountInstruction = SystemProgram.nonceInitialize({
  noncePubkey: nonceAddress, // nonce account pubkey
  authorizedPubkey: nonceAuthority, // nonce account authority (for advance and close)
});

// Add instructions to new transaction
const transaction = new Transaction().add(
  createAccountInstruction,
  initializeAccountInstruction
);

// Send transaction
transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [payer, nonceKeypair] // Signers
);

console.log(
  "\nCreate Nonce Account:",
  `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
);

let accountInfo = await connection.getAccountInfo(nonceAddress);
let nonceData = NonceAccount.fromAccountData(accountInfo.data);

console.log("\nNonce:", nonceData.nonce);

const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
  units: 4000,
});

const advanceNonce = SystemProgram.nonceAdvance({
  noncePubkey: nonceAddress,
  authorizedPubkey: nonceAuthority,
});

const newTransaction = new Transaction()
  .add(advanceNonce)
  .add(modifyComputeUnits);

transactionSignature = await sendAndConfirmTransaction(
  connection,
  newTransaction,
  [payer, nonceKeypair] // 署名者
);

console.log(
  "\nAdvanceNonce:",
  `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
);

accountInfo = await connection.getAccountInfo(nonceAddress);
nonceData = NonceAccount.fromAccountData(accountInfo.data);

console.log("\nNonce:", nonceData.nonce);
