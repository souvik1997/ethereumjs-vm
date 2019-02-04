const genesisData = require('ethereumjs-testing').getSingleFile('BasicTests/genesishashestest.json')
const tape = require('tape')
const VM = require('../')
const createRemoteStateStorage = require('../lib/remoteStateStorage.js')

tape('[Common]: genesis hashes tests', function (t) {
  t.test('should generate the genesis state correctly', function (st) {
    createRemoteStateStorage(function (err, state) {
      if (err) {
        console.log("failed to create remote state")
        st.fail(err)
      } else {
        var vm = new VM({ state: state })
        vm.stateManager.generateCanonicalGenesis(function () {
          vm.stateManager.getStateRoot(function (err, stateRoot) {
            if (err) st.fail(err)
            else {
              st.equal(stateRoot.toString('hex'), genesisData.genesis_state_root)
              st.end()
            }
          })
        })
      }
    })
  })
})
