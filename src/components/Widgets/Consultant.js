import React, { Component } from 'react'
import { connect } from 'react-redux'
import Helpers, { t, pick } from '../../common/Helpers'

class Consultant extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    const { manager } = this.props.user
    return (
      <div className="block  widget__consultant">
        <h3>{t('manager.title')}</h3>
        <div className="flex">
          <img src={manager.avatar} className="widget__consultant-photo" />
          <div>
            <div className="c__gray2">{t('manager.text')}</div>
            <div className="flex">
              <strong>{manager.name}</strong>
              <img src="/img/skype.svg" className="widget__consultant-skype" />
              <a href="#"><strong>{manager.skype}</strong></a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect((state) => pick(state, 'user', 'lang'))(Consultant)
