import React from 'react'
import {connect} from 'react-redux'
import styled from 'react-emotion'

import {Backdrop} from '../components/Layout'
import PersonalForm from '../components/PersonalForm'

import {submit} from '../ducks/submission'

const Title = styled.div`
  position: absolute;
  top: 1em;
  left: 2em;

  color: white;
  font-size: 1.8em;
`

const StepOne = ({submit}) => (
  <Backdrop>
    <Title>STEP 1: ข้อมูลส่วนตัว</Title>
    <PersonalForm onSubmit={submit} />
  </Backdrop>
)

const enhance = connect(null, {submit})

export default enhance(StepOne)