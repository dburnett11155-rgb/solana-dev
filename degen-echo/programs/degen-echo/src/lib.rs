use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod degen_echo {
    use super::*;

    pub fn create_poll(ctx: Context<CreatePoll>, start_price: u64, end_time: i64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.authority = ctx.accounts.authority.key();
        poll.start_price = start_price;
        poll.end_time = end_time;
        poll.total_pump = 0;
        poll.total_dump = 0;
        poll.total_stagnate = 0;
        poll.settled = false;
        poll.winning_choice = 0;
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, choice: u8, amount: u64) -> Result<()> {
        require!(choice >= 1 && choice <= 3, DegenError::InvalidChoice);
        require!(amount > 0, DegenError::InvalidAmount);
        
        let poll = &mut ctx.accounts.poll;
        require!(!poll.settled, DegenError::PollAlreadySettled);

        let bet = &mut ctx.accounts.bet;
        bet.user = ctx.accounts.user.key();
        bet.poll = poll.key();
        bet.choice = choice;
        bet.amount = amount;
        bet.claimed = false;

        match choice {
            1 => poll.total_pump += amount,
            2 => poll.total_dump += amount,
            3 => poll.total_stagnate += amount,
            _ => {}
        }

        // Transfer SOL from user to poll vault
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.poll_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn settle_poll(ctx: Context<SettlePoll>, end_price: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        require!(!poll.settled, DegenError::PollAlreadySettled);

        let price_diff = if end_price > poll.start_price {
            end_price - poll.start_price
        } else {
            poll.start_price - end_price
        };

        let threshold = poll.start_price / 100; // 1% threshold for stagnate

        poll.winning_choice = if price_diff <= threshold {
            3 // stagnate
        } else if end_price > poll.start_price {
            1 // pump
        } else {
            2 // dump
        };

        poll.settled = true;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePoll<'info> {
    #[account(init, payer = authority, space = 8 + Poll::SIZE)]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: vault to hold bets
    #[account(mut)]
    pub poll_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    #[account(init, payer = user, space = 8 + Bet::SIZE)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: vault to hold bets
    #[account(mut)]
    pub poll_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettlePoll<'info> {
    #[account(mut, has_one = authority)]
    pub poll: Account<'info, Poll>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Poll {
    pub authority: Pubkey,
    pub start_price: u64,
    pub end_time: i64,
    pub total_pump: u64,
    pub total_dump: u64,
    pub total_stagnate: u64,
    pub settled: bool,
    pub winning_choice: u8,
}

impl Poll {
    const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Bet {
    pub user: Pubkey,
    pub poll: Pubkey,
    pub choice: u8,
    pub amount: u64,
    pub claimed: bool,
}

impl Bet {
    const SIZE: usize = 32 + 32 + 1 + 8 + 1;
}

#[error_code]
pub enum DegenError {
    #[msg("Choice must be 1 (pump), 2 (dump), or 3 (stagnate)")]
    InvalidChoice,
    #[msg("Bet amount must be greater than 0")]
    InvalidAmount,
    #[msg("Poll has already been settled")]
    PollAlreadySettled,
}