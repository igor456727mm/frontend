import React, { Component } from 'react'
import { Form, Input, Button, Select, message, InputNumber, DatePicker, Popover, Icon } from 'antd'
import qs from 'qs'
import api from '../../../common/Api'
import Helpers, { t } from '../../../common/Helpers'

const paymentSumHelp = (
  <Popover placement="right" content={(
    <span>
      Если сумма положительная - то это пополнение счета. Если отрицательная - списание.
    </span>
  )}>
    <Icon type="question-circle-o" />
  </Popover>
)

class Add extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
    }
  }

  validator = (name, label, input, rules = []) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    return (
      <Form.Item>
        {label && <h4>{label} {name === 'sum' ? paymentSumHelp : null}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, updatePayment } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      const data = {
        walletId: values.wallet_id,
        sum: values.sum >= 0 ? -values.sum : values.sum * (-1),
        data: {
          comment: values.comment,
          date: values.paymentDate.unix(),
        }
      }
      this.setState({ iconLoading: true })
      api.post(`/v1/finances/withdrawals`, qs.stringify(data))
      .then(response => {
        this.setState({ iconLoading: false })
        form.resetFields()
        message.success('Оплата добавлена')
        updatePayment()
      })
      .catch(e => {
        this.setState({ iconLoading: false })
        Helpers.errorHandler(e)
      })
    })
  }

  render() {
    const { iconLoading } = this.state
    const { wallets=[] } = this.props
    const _wallets = wallets.map(item => <Select.Option key={item.id} value={item.id}>{item.name} / {item.data && item.data.number}</Select.Option>)

    return (
      <div className="widget__wallets-add">
        <h3>История оплат</h3>
        <Form onSubmit={this.handleSubmit}>
          {this.validator('sum', 'Сумма', <InputNumber size="large" />, [{ required: true }] )}
          {this.validator('wallet_id', 'Кошелёк', <Select placeholder="Кошелек не выбран" size="large">{_wallets}</Select>, [{ required: true }] )}
          {this.validator('comment', 'Комментарий', <Input size="large" /> )}
          {this.validator('paymentDate', 'Дата оплаты', <DatePicker size="large" />, [{ required: true }] )}
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>Добавить</Button>
          </Form.Item>
        </Form>
      </div>
    )

  }


}

export default Form.create()(Add)
