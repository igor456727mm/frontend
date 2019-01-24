import React, { Component } from 'react'
import { Form, Button, message, Icon, Input } from 'antd'
import Helpers, { clean } from '../Helpers'
import api from '../Api'
import styles from './ChangingText.module.sass'

class ChangingText extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showForm: false,
      text: '',
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { text } = this.props
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if (text) {
      options.initialValue = text
    }
    return (
      <Form.Item className={`form__item-${name}`}>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, text, onTextEdit } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      onTextEdit(values.text)
      this.setState({ showForm: false, text: values.text })
    })
  }

  toggle = () => this.setState({ showForm: !this.state.showForm })

  render() {
    const { showForm, text } = this.state
    const inputText = text ? text : this.props.text
    return (
      <div>
        {!showForm ?
          <div className={styles.form}>
            <span>{inputText}</span>
            <Button onClick={this.toggle} className={styles.btn}><Icon type="edit" /></Button>
          </div>
        :
          <div className={styles.form}>
            <Form>
              {this.validator('text', '', <Input className={styles.input} placeholder="Введите текст" size="large" /> )}
            </Form>
            <div className={styles.btns}>
              <Button onClick={this.toggle} className={styles.btn}><Icon type="close-circle-o" /></Button>
              <Button onClick={this.handleSubmit} className={styles.btn}><Icon type="check-circle-o" /></Button>
            </div>
          </div>
        }
      </div>
    )
  }
}

export default Form.create()(ChangingText)
