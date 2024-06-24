import { Button, Col, Image, Input, Layout, Row, Space, Typography } from 'antd'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { SystemProgram, Transaction, PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'
import logo from 'static/images/solanaLogo.svg'
import brand from 'static/images/solanaLogoMark.svg'
import './index.less'

function View() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [recipient, setRecipient] = useState('')

  const getMyBalance = useCallback(async () => {
    if (!publicKey) return setBalance(0)
    const lamports = await connection.getBalance(publicKey)
    return setBalance(lamports)
  }, [connection, publicKey])

  const airdrop = useCallback(async () => {
    try {
      setLoading(true)
      if (publicKey) await connection.requestAirdrop(publicKey, 10 ** 8)
      return getMyBalance()
    } catch (error) {
      console.log(error)
    } finally {
      return setLoading(false)
    }
  }, [connection, publicKey, getMyBalance])

  const transfer = useCallback(async () => {
    try {
      setLoading(true)
      if (publicKey && recipient) {
        const recipientPublicKey = new PublicKey(recipient)
        const instruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPublicKey,
          lamports: 10 ** 6,
        })

        const transaction = new Transaction().add(instruction)
        const {
          context: { slot: minContextSlot },
          value: { blockhash, lastValidBlockHeight },
        } = await connection.getLatestBlockhashAndContext()
        const signature = await sendTransaction(transaction, connection, {
          minContextSlot,
        })

        await connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        })
        return getMyBalance()
      }
    } catch (error) {
      console.log(error)
    } finally {
      return setLoading(false)
    }
  }, [connection, publicKey, getMyBalance, recipient])

  useEffect(() => {
    getMyBalance()
  }, [getMyBalance])

  return (
    <Layout className="container">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Row gutter={[24, 24]}>
            <Col flex="auto">
              <img alt="logo" src={brand} height={16} />
            </Col>
            <Col>
              <WalletMultiButton />
            </Col>
          </Row>
        </Col>
        <Col span={24} style={{ textAlign: 'center' }}>
          <Space direction="vertical" size={24}>
            <Image src={logo} preview={false} width={256} />
            <Typography.Title level={1}>React + Solana = DApp</Typography.Title>
            <Typography.Title>
              My Balance: {balance / 10 ** 9} SOL
            </Typography.Title>
            <Input
              placeholder="Recipient Wallet Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Button
              type="primary"
              size="large"
              onClick={airdrop}
              loading={loading}
            >
              Airdrop
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={transfer}
              loading={loading}
              disabled={!recipient}
            >
              Transfer
            </Button>
          </Space>
        </Col>
      </Row>
    </Layout>
  )
}

export default View
