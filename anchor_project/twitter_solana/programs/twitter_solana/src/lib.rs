use anchor_lang::prelude::*;

declare_id!("HFGM3t5xs4TNSNUZxZznc6hXydMoEb4TVqCPdyfMBX5F");

#[program]
pub mod twitter_solana {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let user_profile = &mut ctx.accounts.user_profile;
        let clock: Clock = Clock::get().unwrap();

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }

        if user_profile.tweet_count == 0 {
            user_profile.bump = ctx.bumps.user_profile;
        }

        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;
        tweet.count = user_profile.tweet_count;
        tweet.bump = ctx.bumps.tweet;

        user_profile.tweet_count = user_profile.tweet_count.checked_add(1).unwrap();

        Ok(())
    }

    pub fn update_tweet(ctx: Context<UpdateTweet>, topic: String, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }

        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }

    pub fn delete_tweet(_ctx: Context<DeleteTweet>, _topic: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(topic: String)]
pub struct SendTweet<'info> {
    #[account(
        init_if_needed,
        payer = author,
        space = 8 + 8 + 1, // discriminator + tweet_count + bump
        seeds = [b"user-profile", author.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(init, payer = author, space = Tweet::LEN, seeds = [
        b"tweet", // tweet
        author.key().as_ref(), // author pubkey
        topic.as_bytes(), // topic
        user_profile.tweet_count.to_le_bytes().as_ref() // tweet_count
    ],
        bump
    )]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(topic: String)]
pub struct UpdateTweet<'info> {
    #[account(mut, has_one = author, seeds=[
        b"tweet",
        author.key().as_ref(),
        topic.as_bytes(),
        tweet.count.to_le_bytes().as_ref()
    ], bump)]
    pub tweet: Account<'info, Tweet>,
    #[account(
        seeds = [b"user-profile", author.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(topic: String)]
pub struct DeleteTweet<'info> {
    #[account(mut, has_one = author, close = author, seeds=[
        b"tweet",
        author.key().as_ref(),
        topic.as_bytes(),
        tweet.count.to_le_bytes().as_ref()
    ], bump)]
    pub tweet: Account<'info, Tweet>,
    #[account(
        seeds = [b"user-profile", author.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub author: Signer<'info>,
}

#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
    pub count: u64,
    pub bump: u8,
}

#[account]
pub struct UserProfile {
    pub tweet_count: u64,
    pub bump: u8,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.
const MAX_COUNT_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 1;

impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH // Content.
        + MAX_COUNT_LENGTH // Count
        + BUMP_LENGTH; // Bump
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}
