import { useWorkspace } from '@/composables'
import { PublicKey } from '@solana/web3.js'

export const updateTweet = async (tweet, topic, content) => {
  const { wallet, program } = useWorkspace()

  // Get user profile PDA
  const [userProfilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.value.publicKey.toBuffer()],
    program.value.programId,
  )

  await program.value.methods
    .updateTweet(topic, content)
    .accounts({
      tweet: tweet.publicKey,
      userProfile: userProfilePDA,
      author: wallet.value.publicKey,
    })
    .rpc()

  tweet.topic = topic
  tweet.content = content
}

// change method calls
