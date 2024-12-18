import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { TwitterSolana } from '../target/types/twitter_solana';
import { expect } from 'chai';

describe('twitter_solana', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TwitterSolana as Program<TwitterSolana>;

  // Helper get PDA functions
  const getUserProfilePDA = (
    walletPublicKey: PublicKey,
    programId: PublicKey
  ): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode('user-profile'),
        walletPublicKey.toBuffer(),
      ],
      programId
    );
  };

  const getTweetPDA = (
    walletPublicKey: PublicKey,
    topic: string,
    count: number,
    programId: PublicKey
  ): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode('tweet'),
        walletPublicKey.toBuffer(),
        anchor.utils.bytes.utf8.encode(topic),
        new anchor.BN(count).toArrayLike(Buffer, 'le', 8),
      ],
      programId
    );
  };

  describe('Send Tweet Instruction', () => {
    // Happy path
    it('Can send a tweet', async () => {
      const topic = 'solana';
      const content = 'Solana is awesome!';

      // Get PDAs using helper functions
      const [userProfilePDA] = getUserProfilePDA(
        provider.wallet.publicKey,
        program.programId
      );
      const [tweetPDA] = getTweetPDA(
        provider.wallet.publicKey,
        topic,
        0,
        program.programId
      );

      await program.methods
        .sendTweet(topic, content)
        .accounts({
          userProfile: userProfilePDA,
          tweet: tweetPDA,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const tweetAccount = await program.account.tweet.fetch(tweetPDA);
      expect(tweetAccount.topic).to.equal(topic);
      expect(tweetAccount.content).to.equal(content);
      expect(tweetAccount.author.toBase58()).to.equal(
        provider.wallet.publicKey.toBase58()
      );
    });

    // Unhappy path
    it('Cannot send a tweet with content longer than 280 characters', async () => {
      const topic = 'solana';
      const content = 'x'.repeat(281); // Create 281 character content

      const [userProfilePDA] = getUserProfilePDA(
        provider.wallet.publicKey,
        program.programId
      );
      const [tweetPDA] = getTweetPDA(
        provider.wallet.publicKey,
        topic,
        1,
        program.programId
      );

      try {
        await program.methods
          .sendTweet(topic, content)
          .accounts({
            userProfile: userProfilePDA,
            tweet: tweetPDA,
            author: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail('The instruction should have failed');
      } catch (error) {
        expect(error.error.errorMessage).to.equal(
          'The provided content should be 280 characters long maximum.'
        );
      }
    });
  });

  describe('Update Tweet Instruction', () => {
    // Happy path
    it('Can update a tweet', async () => {
      const topic = 'solana';
      const originalContent = 'Original tweet content';
      const updatedContent = 'Updated tweet content';

      // Get user PDA
      const [userProfilePDA] = getUserProfilePDA(
        provider.wallet.publicKey,
        program.programId
      );
      const userProfile = await program.account.userProfile.fetch(
        userProfilePDA
      );

      // Get tweet PDA
      const [tweetPDA] = getTweetPDA(
        provider.wallet.publicKey,
        topic,
        userProfile.tweetCount.toNumber(),
        program.programId
      );

      // Send the initial tweet
      await program.methods
        .sendTweet(topic, originalContent)
        .accounts({
          userProfile: userProfilePDA,
          tweet: tweetPDA,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Update the tweet
      await program.methods
        .updateTweet(topic, updatedContent)
        .accounts({
          tweet: tweetPDA,
          userProfile: userProfilePDA,
          author: provider.wallet.publicKey,
        })
        .rpc();

      // Fetch and verify the updated tweet
      const tweetAccount = await program.account.tweet.fetch(tweetPDA);
      expect(tweetAccount.topic).to.equal(topic);
      expect(tweetAccount.content).to.equal(updatedContent);
      expect(tweetAccount.author.toBase58()).to.equal(
        provider.wallet.publicKey.toBase58()
      );
    });

    // Unhappy path
    it('Cannot update a tweet with content longer than 280 characters', async () => {
      const topic = 'solana';
      const originalContent = 'Original tweet content';
      const tooLongContent = 'x'.repeat(281);

      // Get PDA(s)
      const [userProfilePDA] = getUserProfilePDA(
        provider.wallet.publicKey,
        program.programId
      );
      const userProfile = await program.account.userProfile.fetch(
        userProfilePDA
      );

      const [tweetPDA] = getTweetPDA(
        provider.wallet.publicKey,
        topic,
        userProfile.tweetCount.toNumber(),
        program.programId
      );

      // Send the initial tweet
      await program.methods
        .sendTweet(topic, originalContent)
        .accounts({
          userProfile: userProfilePDA,
          tweet: tweetPDA,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Try to update with invalid content
      try {
        await program.methods
          .updateTweet(topic, tooLongContent)
          .accounts({
            tweet: tweetPDA,
            userProfile: userProfilePDA,
            author: provider.wallet.publicKey,
          })
          .rpc();
        expect.fail('The instruction should have failed');
      } catch (error) {
        expect(error.error.errorMessage).to.equal(
          'The provided content should be 280 characters long maximum.'
        );
      }
    });
  });

  describe('Delete Tweet Instruction', () => {
    // Happy path
    it('Can delete a tweet', async () => {
      const topic = 'solana';
      const content = 'Tweet to be deleted';

      // Get PDA(s)
      const [userProfilePDA] = getUserProfilePDA(
        provider.wallet.publicKey,
        program.programId
      );
      const userProfile = await program.account.userProfile.fetch(
        userProfilePDA
      );

      const [tweetPDA] = getTweetPDA(
        provider.wallet.publicKey,
        topic,
        userProfile.tweetCount.toNumber(),
        program.programId
      );

      // Send the tweet
      await program.methods
        .sendTweet(topic, content)
        .accounts({
          userProfile: userProfilePDA,
          tweet: tweetPDA,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Delete the tweet
      await program.methods
        .deleteTweet(topic)
        .accounts({
          tweet: tweetPDA,
          userProfile: userProfilePDA,
          author: provider.wallet.publicKey,
        })
        .rpc();

      // Verify the tweet account no longer exists
      const tweetAccount = await program.account.tweet.fetchNullable(tweetPDA);
      expect(tweetAccount).to.equal(null);
    });

    // Unhappy path
    it("Cannot delete another user's tweet", async () => {
      const topic = 'solana';
      const content = 'Tweet that should not be deletable by others';

      // First create a tweet
      const [userProfilePDA] = getUserProfilePDA(
        provider.wallet.publicKey,
        program.programId
      );
      const userProfile = await program.account.userProfile.fetch(
        userProfilePDA
      );

      const [tweetPDA] = getTweetPDA(
        provider.wallet.publicKey,
        topic,
        userProfile.tweetCount.toNumber(),
        program.programId
      );

      // Send the tweet
      await program.methods
        .sendTweet(topic, content)
        .accounts({
          userProfile: userProfilePDA,
          tweet: tweetPDA,
          author: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Create a new keypair to act as different user
      const otherUser = anchor.web3.Keypair.generate();

      // Try to delete the tweet as different user
      try {
        await program.methods
          .deleteTweet(topic)
          .accounts({
            tweet: tweetPDA,
            userProfile: userProfilePDA,
            author: otherUser.publicKey,
          })
          .signers([otherUser])
          .rpc();
        expect.fail('The instruction should have failed');
      } catch (error) {
        expect(error.message).to.include(
          'AnchorError caused by account: tweet'
        );
      }
    });
  });
});
