import {call, put, select} from 'redux-saga/effects'
import {message} from 'antd'

import {createReducer, Creator} from './helper'

import rsf, {app} from '../core/fire'
import history from '../core/history'
import {getMajorFromPath} from '../core/util'
import logger from '../core/log'

import {setLoading} from '../ducks/submission'

const db = app.firestore()

export const STORE_CAMPER = 'STORE_CAMPER'

export const storeCamper = Creator(STORE_CAMPER)

const LoadingMessage = `กำลังดึงข้อมูลการสมัครเข้าค่าย กรุณารอสักครู่...`
const MajorRedirectLog = `User has chosen a major before. Redirecting to:`
const MajorRedirectMessage = `กำลังเปลี่ยนหน้าไปที่แบบฟอร์มสมัครเข้าสาขา `
const ChangeDeniedMessage = `คุณไม่สามารถเปลี่ยนสาขาได้อีก หลังจากที่เลือกสาขานั้นๆ ไปแล้ว`

// Check if user is at major root, e.g. /:major
function isMajorRoot(major) {
  return window.location.pathname.replace('/', '') === major
}

// Analytics Module
function Identify(uid, displayName, email, photoURL) {
  // Segment
  if (window.analytics) {
    window.analytics.identify(uid, {
      name: displayName,
      email,
      photoURL,
    })
  }

  // Fullstory
  if (window.FS) {
    window.FS.identify(uid, {
      email,
      displayName,
      photoURL,
    })
  }

  // Sentry
  if (window.Raven) {
    window.Raven.setUserContext({
      id: uid,
      email,
      displayName,
      photoURL,
    })
  }

  // Google Analytics
  if (window.ga) {
    window.ga('set', 'userId', uid)
  }

  // prettier-ignore
  logger.log(`[Analytics] Identified Camper ${uid}'s identity as ${displayName}`)
}

export function* loadCamperSaga() {
  const hide = message.loading(LoadingMessage, 0)
  yield put(setLoading(true))

  try {
    const major = getMajorFromPath()
    const user = yield select(s => s.user)
    const {uid, displayName, email, photoURL} = user

    logger.log('Camper UID', uid, '| Major', major, '| Facebook', displayName)

    if (!uid) {
      logger.warn("Camper hasn't authenticated yet. This should not happen.")
      return
    }

    // Retrieve the camper information
    const docRef = db.collection('campers').doc(uid)
    const doc = yield call(rsf.firestore.getDocument, docRef)

    // Identify camper's identity in analytics.
    Identify(uid, displayName, email, photoURL)

    // If the document does exist, simply navigate to the "Change Denied" route
    if (doc.exists) {
      const record = doc.data()
      logger.log('Retrieved Camper Record:', record)

      // Store the camper's information into redux store
      yield put(storeCamper(record))

      // A - If user is at root path and had chosen a major, redirect them.
      if (record.major && window.location.pathname === '/') {
        logger.info(MajorRedirectLog, record.major)

        yield call(message.info, MajorRedirectMessage + record.major)
        yield call(history.push, `/${record.major}/step1`)

        return
      }

      // B - If user is not at major path, such as "/" or "/thankyou"
      if (!major) {
        logger.info('User is not at major path:', window.location.pathname)

        return
      }

      // C - If user is not at the same major they had chosen at first.
      if (record.major !== major) {
        yield call(message.warn, ChangeDeniedMessage)
        yield call(history.push, '/change_denied?major=' + major)

        if (window.analytics) {
          window.analytics.track('Change Denied', {
            uid,
            displayName,
            newMajor: major,
            oldMajor: record.major,
          })
        }

        return
      }

      if (window.analytics) {
        window.analytics.track('Returned', {uid, displayName, major})
      }

      // If user is at /:major, redirect to /:major/step1
      if (isMajorRoot(major)) {
        logger.info('User is at major root. Redirecting to Step 1.')

        yield call(history.push, `/${major}/step1`)
      }

      return
    }

    // D - If user arrives for the first time, create a Camper ID for them.
    const data = {
      major,
      facebookDisplayName: displayName,
      facebookEmail: email,
      facebookPhotoURL: photoURL,
      createdAt: new Date(),
    }

    yield call(rsf.firestore.setDocument, docRef, data)

    if (window.analytics) {
      window.analytics.track('Arrived', {uid, displayName, major})
    }

    logger.log('Created Record for New Camper:', displayName, '->', data)

    // If user is at /:major, redirect to /:major/step1
    if (isMajorRoot(major)) {
      yield call(history.push, `/${major}/step1`)
    }
  } catch (err) {
    message.error(err.message)

    if (window.Raven) {
      window.Raven.captureException(err)
    }
  } finally {
    hide()
    yield put(setLoading(false))
  }
}

const initial = {
  birthdate: '2001-1-1',
}

export default createReducer(initial, state => ({
  [STORE_CAMPER]: camper => camper,
}))
