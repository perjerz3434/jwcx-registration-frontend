import * as R from 'ramda'
import {message} from 'antd'
import firebase from 'firebase'
import {takeEvery, call, put, fork} from 'redux-saga/effects'

import {createReducer, Creator} from './helper'

import rsf, {app} from '../core/fire'

export const LOGIN = 'LOGIN'
export const LOGOUT = 'LOGOUT'

export const STORE_USER = 'STORE_USER'
export const CLEAR_USER = 'CLEAR_USER'
export const SET_LOADING = 'SET_LOADING'

export const login = Creator(LOGIN)
export const logout = Creator(LOGOUT)

export const storeUser = Creator(STORE_USER)
export const clearUser = Creator(CLEAR_USER)
export const setLoading = Creator(SET_LOADING)

const db = app.firestore()

// Serializes the user's information into an object
const userProps = R.pick([
  'uid',
  'displayName',
  'email',
  'phoneNumber',
  'photoURL',
  'metadata',
])

export function* loginSaga() {
  const hide = message.loading('กำลังยืนยันตัวตนผ่าน Facebook...', 0)

  const provider = new firebase.auth.FacebookAuthProvider()
  provider.addScope('email')
  provider.addScope('public_profile')

  try {
    const auth = yield call(rsf.auth.signInWithPopup, provider)
    console.log('Authentication Credentials', auth)

    const cred = yield call(rsf.auth.signInAndRetrieveDataWithCredential, auth)
    console.log('User Credentials', cred)

    yield call(hide)

    message.info('ยินดีต้อนรับ!')

    yield fork(authRoutineSaga, cred.user)
  } catch (err) {
    yield call(hide)

    // The facebook login popup was closed by the user
    if (err.code === 'auth/popup-closed-by-user') {
      return
    }

    console.warn(err.code, err.message)
    message.error(err.message)
  }
}

export function* logoutSaga() {
  try {
    yield call(rsf.auth.signOut)
    yield put(clearUser())
  } catch (err) {
    message.error(err.message)
  }
}

// Routines to perform when the user begins or resumes their session
export function* authRoutineSaga(user) {
  yield put(storeUser(user))
}

const getUserStatus = () =>
  new Promise((resolve, reject) => {
    app.auth().onAuthStateChanged(resolve, reject)
  })

// Attempt to re-authenticate when user resumes their session
export function* reauthSaga() {
  try {
    const user = yield call(getUserStatus)
    console.log('Reauthenticated:', user)

    if (user) {
      yield fork(authRoutineSaga, user)
    }
  } catch (err) {
    message.warn(err.message)
  } finally {
    yield put(setLoading(false))
  }
}

export function* userWatcherSaga() {
  yield takeEvery(LOGIN, loginSaga)
  yield takeEvery(LOGOUT, logoutSaga)
}

const initial = {
  loading: true,
}

export default createReducer(initial, state => ({
  [SET_LOADING]: loading => ({...state, loading}),
  [STORE_USER]: user => user && userProps(user),
  [CLEAR_USER]: () => ({}),
}))
