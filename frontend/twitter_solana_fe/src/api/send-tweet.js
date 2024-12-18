import { web3 } from '@coral-xyz/anchor'
import { useWorkspace } from '@/composables'
import { Tweet } from '@/models'

// 1. Define the sendTweet endpoint.
export const sendTweet = async (topic, content) => {
  const { wallet, program } = useWorkspace()

  // Get the user profile PDA
  const [userProfilePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.value.publicKey.toBuffer()],
    program.value.programId,
  )

  // Fetch user profile to get tweet count
  let userProfile
  try {
    userProfile = await program.value.account.userProfile.fetch(userProfilePda)
  } catch {
    // If user profile doesn't exist, count starts at 0
    userProfile = { tweetCount: 0 }
  }

  // Get the tweet PDA
  const [tweetPda] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('tweet'),
      wallet.value.publicKey.toBuffer(),
      Buffer.from(topic),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(userProfile.tweetCount)]).buffer)),
    ],
    program.value.programId,
  )

  // 3. Send a "SendTweet" instruction with the right data and the right accounts.
  await program.value.methods
    .sendTweet(topic, content)
    .accounts({
      userProfile: userProfilePda,
      tweet: tweetPda,
      author: wallet.value.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc()

  // 4. Fetch the newly created account from the blockchain.
  const tweetAccount = await program.value.account.tweet.fetch(tweetPda)

  // 5. Wrap the fetched account in a Tweet model so our frontend can display it.
  return new Tweet(tweetPda, tweetAccount)
}
