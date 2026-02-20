use anchor_lang::prelude::*;

declare_id!("GPB6S4dHFH28JhuoALFtxe3XFVPFSce4tBn6hHV5w67T");

#[program]
pub mod my_first_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
