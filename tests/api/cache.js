const { promisify } = require('util')
const tape = require('tape')
const createRemoteStateStorage = require('../lib/remoteStateStorage.js')
const Account = require('ethereumjs-account').default
const Cache = require('../../lib/cache')
const utils = require('./utils')

tape('cache initialization', (t) => {
  createRemoteStateStorage(function (err, remoteStateStorage) {
    if (err) {
      console.log("failed to create remote state")
    } else {
      t.test('should initialize', async (st) => {
        const c = new Cache(remoteStateStorage)
        st.ok(remoteStateStorage.getRoot().equals(c._remoteStateStorage.getRoot()), 'initializes given trie')
        st.end()
      })
    }
    t.end()
  })
})

tape('cache put and get account', (t) => {
  createRemoteStateStorage(function (err, remoteStateStorage) {
    if (err) {
      console.log("failed to create remote state")
    } else {
      const c = new Cache(remoteStateStorage)
      const flushP = promisify(c.flush.bind(c))
      const remoteStateStorageGetP = promisify(remoteStateStorage.get.bind(remoteStateStorage))

      const addr = Buffer.from('cd2a3d9f938e13cd947ec05abc7fe734df8dd826', 'hex')
      const acc = utils.createAccount('0x00', '0xff11')

      t.test('should fail to get non-existent account', async (st) => {
        const res = c.get(addr)
        st.notOk(res.balance.equals(acc.balance))
        st.end()
      })

      t.test('should put account', async (st) => {
        c.put(addr, acc)
        const res = c.get(addr)
        st.ok(res.balance.equals(acc.balance))
        st.end()
      })

      t.test('should not have flushed to trie', async (st) => {
        const res = await remoteStateStorageGetP(addr)
        st.notOk(res)
        st.end()
      })

      t.test('should flush to trie', async (st) => {
        await flushP()
        st.end()
      })

      t.test('trie should contain flushed account', async (st) => {
        const raw = await remoteStateStorageGetP(addr)
        const res = new Account(raw)
        st.ok(res.balance.equals(acc.balance))
        st.end()
      })

      t.test('should delete account from cache', async (st) => {
        c.del(addr)

        const res = c.get(addr)
        st.notOk(res.balance.equals(acc.balance))
        st.end()
      })

      t.test('should warm cache and load account from trie', async (st) => {
        await promisify(c.warm.bind(c))([addr])

        const res = c.get(addr)
        st.ok(res.balance.equals(acc.balance))
        st.end()
      })

      t.test('should update loaded account and flush it', async (st) => {
        const updatedAcc = utils.createAccount('0x00', '0xff00')
        c.put(addr, updatedAcc)
        await flushP()

        const raw = await remoteStateStorageGetP(addr)
        const res = new Account(raw)
        st.ok(res.balance.equals(updatedAcc.balance))
        st.end()
      })
    }
    t.end()
  })
})

tape('cache checkpointing', (t) => {


  t.test('should revert to correct state', async (st) => {
    createRemoteStateStorage(function (err, remoteStateStorage) {
      if (err) {
        console.log("failed to create remote state")
      } else {
        const c = new Cache(remoteStateStorage)

        const addr = Buffer.from('cd2a3d9f938e13cd947ec05abc7fe734df8dd826', 'hex')
        const acc = utils.createAccount('0x00', '0xff11')
        const updatedAcc = utils.createAccount('0x00', '0xff00')
        c.put(addr, acc)
        c.checkpoint()
        c.put(addr, updatedAcc)

        let res = c.get(addr)
        st.ok(res.balance.equals(updatedAcc.balance))

        c.revert()

        res = c.get(addr)
        st.ok(res.balance.equals(acc.balance))

        st.end()
      }
    })
  })
})
