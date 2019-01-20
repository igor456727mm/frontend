import React, { Component } from 'react'
import { Form, Input, Button, Select, message, InputNumber, DatePicker } from 'antd'
import qs from 'qs'
import api from '../../../common/Api'
import Helpers, { t } from '../../../common/Helpers'

const walletsTemp = [
  {
    id: 1407,
    name: 'кошелек 1',
    data: {number: "Z596596954969"},
  },
  {
    id: 1408,
    name: 'кошелек 2',
    data: {number: "Z746593814969"},
  },
]

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
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, addPayment } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      console.log('Заказать выплату values', values);
      // this.setState({ iconLoading: true })
      // values.data = JSON.stringify(values.data)
      // api.post(`/v1/wallets`, qs.stringify(values))
      // .then(response => {
      //   this.setState({ iconLoading: false })
      //   form.resetFields()
      //   message.success(t('wallets.add.message.success'))
      //   addPayment()
      // })
      // .catch(e => {
      //   this.setState({ iconLoading: false })
      //   Helpers.errorHandler(e)
      // })
    })
  }

  // renderWalletNumber = () => {
  //   const { form, modules } = this.props
  //   const { wallet_module_id } = form.getFieldsValue()
  //   if(!wallet_module_id) return
  //   const { rules } = modules[wallet_module_id]
  //   return rules.required.map((field, i) => {
  //     const message = modules[wallet_module_id].error_messages[`/${field}`].pattern
  //     return (
  //       <div key={i}>
  //         {this.validator(`data[${field}]`, rules.properties[field].title, <Input size="large" />, [{ required: true, pattern: rules.properties[field].pattern, message: message }] )}
  //       </div>
  //     )
  //   })
  // }

  render() {
    const { iconLoading } = this.state
    const _wallets = walletsTemp.map(item => <Select.Option key={item.id} value={item.id}>{item.name} / {item.data && item.data.number}</Select.Option>)

    return (
      <div className="widget__wallets-add">
        <h3>История оплат</h3>
        <Form onSubmit={this.handleSubmit}>
          {this.validator('sum', 'Сумма', <InputNumber size="large" />, [{ required: true }] )}
          {this.validator('wallet_id', 'Кошелёк', <Select placeholder="Кошелек не выбран" size="large">{_wallets}</Select>, [{ required: true }] )}
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
