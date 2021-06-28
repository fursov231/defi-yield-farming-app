const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");
const TokenFarm = artifacts.require("TokenFarm");

require('chai')
    .use(require("chai-as-promised"))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, "ether")
}

contract("TokenFarm", ([owner, investor]) => {

    let daiToken, dappToken, tokenFarm

    before(async () => {
        //Load contracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        //Transfer all Dapp tokens to farm (1 million)
        await dappToken.transfer(tokenFarm.address, tokens("1000000"))

        //Send tokens to investor
        await daiToken.transfer(investor, tokens("100"), {from: owner})
    })

    describe('Mock Dai Deployment', async () => {
        it("has a name", async () => {
            const name = await daiToken.name()
            assert.equal(name, "Mock DAI Token")
        })
    })

    describe('Dapp Token Deployment', async () => {
        it("has a name", async () => {
            const name = await dappToken.name()
            assert.equal(name, "DApp Token")
        })
    })

    describe('Token Farm deployment', async () => {
        it("has a name", async () => {
            const name = await tokenFarm.name()
            assert.equal(name, "DApp Token Farm")
        })

        it("contract has tokens", async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens("1000000"))
        })

    })

    describe("Farming tokens", async () => {
        it("rewards investors for staking Mock DAI tokens", async () => {
            let result

            //Check investor`s balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("100"), "investor`s Mock DAI wallet balance should be correct before staking")

            //Stake Mock DAI tokens
            await daiToken.approve(tokenFarm.address, tokens("100"), {from: investor})
            await tokenFarm.stakeTokens(tokens("100"), {from: investor})

            //Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("0"), "Investor`s Mock DAI wallet balance should be correct after staking")

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens("100"), "Token Farm Mock DAI wallet balance should be correct after staking")

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens("100"), "Investor`s Mock staking balance should be correct after staking")

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), "true", "Investor`s staking status should be correct after staking")

            //Issue tokens
            await tokenFarm.issueTokens({from: owner})

            //Check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("100"), "Investor`s DApp token wallet balance correct after issuance")

            //Ensure that only owner can issue tokens
            await tokenFarm.issueTokens({from: investor}).should.be.rejected;

            //Unstake tokens
            await tokenFarm.unstakeTokens({from: investor})

            //Check result after unstaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("100"), "Investor`s Mock DAI wallet balance should be correct after unstaking")

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens("0"), "Token Farm`s Mock DAI balance should be correct after unstaking")

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens("0"), "Investor`s staking balance should be correct after unstaking")

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), "false", "Investor`s staking status should be correct after unstaking")

        })

    })
})