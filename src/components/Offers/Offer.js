import React, { Component } from 'react'
import { Form, Table, Select, Input, InputNumber, DatePicker, Button, message, Upload, Icon, Checkbox, Modal, Popconfirm } from 'antd'
import moment from 'moment'
import Cookies from 'js-cookie'
import qs from 'qs'
import { connect } from 'react-redux'
import { Route, Redirect, Switch, NavLink, Link } from 'react-router-dom'
import Helpers, { t, pick, clean, TreeSelectRemote, OfferAccessButton } from '../../common/Helpers'
import api from '../../common/Api'
import * as Feather from 'react-feather'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { domain, cookie_prefix } from '../../../package.json'



const Icons = {}
class _Landing extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
      isEdit: props.data ? true : false
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.props
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data && [name]) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, offer_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)
      if(data && data.id) {
        api.patch(`/v1/landings/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Лендинг сохранен'))
          window.dispatchEvent(new Event('landings.fetch'))
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        values.offer_id = offer_id
        api.post(`/v1/landings`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Лендинг добавлен'))
          window.dispatchEvent(new Event('landings.fetch'))
          form.resetFields()
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }
    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  render() {
    const { isVisible, iconLoading, isEdit } = this.state
    const { data } = this.props
    return (
      <span>
        {isEdit && <span onClick={this._toggle}>{Icons.settings}</span> || <Button style={{ float: 'right' }} onClick={this._toggle}>Добавить</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Лендинг #${data.id}` : 'Создание лендинга'}</h1>
          <Form>
            {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
            {this.validator('url', t('field.url'), <Input size="large" />, [] )}
            <Form.Item className="form__item-last">
              <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </span>
    )
  }

}
const Landing = Form.create()(_Landing)

class _Action extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      isVisible: false,
      isEdit: props.data ? true : false
    }
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.props
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data && data[name]) {
      options.initialValue = data[name]
    } else if(data && name.includes('.')) {
      const tmp = data && flatten(data) || {}
      if(initialValue) {
        options.initialValue = initialValue
      } else if(tmp[name]) {
        options.initialValue = tmp[name]
      }

      if(['pay_conditions.fields.commission_percent', 'pay_conditions.fields.revshare_percent'].includes(name) && tmp[name]) {
        options.initialValue = parseFloat(tmp[name]) * 100
      }
    }

    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { form, data, offer_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)

      if(values.pay_conditions.fields.commission_percent) values.pay_conditions.fields.commission_percent = values.pay_conditions.fields.commission_percent / 100
      if(values.pay_conditions.fields.revshare_percent) values.pay_conditions.fields.revshare_percent = values.pay_conditions.fields.revshare_percent / 100

      if(data && data.id) {
        api.patch(`/v1/actions/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Цель сохранена'))
          window.dispatchEvent(new Event('actions.fetch'))
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        values.offer_id = offer_id
        api.post(`/v1/actions`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('Цель добавлена'))
          window.dispatchEvent(new Event('actions.fetch'))
          form.resetFields()
          this._toggle()
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }
    })
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  render() {
    const { isVisible, iconLoading, isEdit } = this.state
    const { data, form } = this.props
    const currency = '$'

    let fields = null
    const { pay_conditions } = form.getFieldsValue()
    if(pay_conditions && pay_conditions.pay_type) {
      switch (pay_conditions.pay_type) {
        case 'fix':
          fields = (
            <div className="row">
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.price', `Стоимость в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.commission', `Комиссия в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
            </div>
          )
          break;
        case 'flex':
          fields = (
            <div className="row">
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.price_from', `Стоимость от, в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.price_to', `Стоимость до, в ${currency}`, <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-12">
                {this.validator('pay_conditions.fields.commission_percent', 'Комиссия', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={100} size="large"/>, [], '0' )}
              </div>
            </div>
          )
          break;
        case 'revshare':
          fields = (
            <div className="row">
              <div className="col-md-12">
                {this.validator('pay_conditions.fields.revshare_percent', 'Ревшара', <InputNumber formatter={value => `${value}%`} parser={value => value.replace('%', '')} min={0} max={100} size="large"/>, [], '0' )}
              </div>
            </div>
          )
          break;
      }
    }

    return (
      <span>
        {isEdit && <span onClick={this._toggle}>{Icons.settings}</span> || <Button style={{ float: 'right' }} onClick={this._toggle}>Добавить</Button>}
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
          <h1>{isEdit ? `Цель #${data.id}` : 'Добавление цели'}</h1>
          <Form>
            {this.validator('name', t('field.name'), <Input size="large" />, [{ required: true }] )}
            {this.validator('description', 'Описание', <Input size="large" /> )}
            {this.validator('alias', 'Код действия (например: reg или dep)', <Input size="large" /> )}
            {this.validator('pay_conditions.pay_type', 'Ставка', (
              <Select size="large">
                <Select.Option value="fix">Фиксированная</Select.Option>
                <Select.Option value="flex">Динамическая</Select.Option>
                <Select.Option value="revshare">Revshare</Select.Option>
              </Select>
            ))}

            {fields}

            <div className="row">
              <div className="col-md-6">
                {this.validator('pay_conditions.fields.hold', 'Холд', <InputNumber min={0} size="large" /> )}
              </div>
              <div className="col-md-6">

              </div>
            </div>

            <Form.Item className="form__item-last">
              <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>
          </Form>
        </Modal>
      </span>
    )
  }

}
const Action = Form.create()(_Action)

class Offer extends Component {

  constructor(props) {
    super(props)
    const { id } = props.match.params
    this.state = {
      isNew: id == 'new',
      isLoading: false,
      data: {
        id: id,
        description: null,
        status: 'active',
        visible: 1,
      },
      countries: [],
      categories: [],
      statuses: {},
      landings: [],
      sources: [], // global sources
      actions: [],
      columns: {
        actions: [
          {
            title: 'Цели',
            dataIndex: 'name',
            render: (text, row) => {
              return (
                <div>
                  <strong className="table__actions-name">{text}</strong>
                  <div>{row.description}</div>
                </div>
              )
            }
          }, {
            title: 'Ставка',
            render: (text, row) => {
              const currency = '$'
              const { pay_type, fields } = row.pay_conditions
              let amount
              switch(pay_type) {
                case 'fix':
                  amount = `${fields.price} ${currency}`
                  break;
                case 'flex':
                  amount = fields.price_to && `до ${fields.price_to} ${currency}` || `от ${fields.price_from} ${currency}`
                  break;
                case 'revshare':
                  amount = `${fields.revshare_percent * 100}%`
                  break;
              }
              return <div>{amount}</div>
            }
          }, {
            title: 'Холд',
            render: (text, row) => {
              const { fields } = row.pay_conditions
              return `до ${fields.hold} дней`
            }
          }, {
            title: <Action offer_id={id} />,
            render: (text, row) => {
              return (
              <div className="table__actions" style={{ textAlign: 'right' }}>
                <Action data={row} offer_id={id} currency_id={this.props.form.getFieldValue('currency_id')} />
                <Popconfirm title="Удалить" onConfirm={() => this._onDeleteAction(row.id)} okText="Да" cancelText="Нет">
                  <span className="table__actions-delete">{Icons.delete}</span>
                </Popconfirm>
              </div>
            )}
          }
        ],
        landings: [
          {
            title: 'Лендинг',
            dataIndex: 'name',
          }, {
            title: 'URL',
            dataIndex: 'url',
            render: (text) => text && <a href={text} target="_blank">{text}</a> || '-'
          }, {
            title: 'CR',
            dataIndex: 'sys_cr',
            render: text => `${text}%`
          }, {
            title: 'EPC',
            dataIndex: 'sys_epc'
          }, {
            title: <Landing offer_id={id} />,
            render: (text, row) => {
              const link = `https://webmaster-api.yb.partners/v1/landings/${row.id}/open`
              return (
              <div className="table__actions">
                <span><a href={link} target="_blank">{Icons.eye}</a></span>
                <Landing data={row} offer_id={id} />
                <Popconfirm title="Удалить" onConfirm={() => this._onDeleteLanding(row.id)} okText="Да" cancelText="Нет">
                  <span className="table__actions-delete">{Icons.delete}</span>
                </Popconfirm>
              </div>
            )}
          }
        ]
      },

      logo_upload_image_id: null,
      new_logo: null,
    }
  }

  componentDidMount = () => {
    Helpers.setTitle('menu.offers')
    const { isNew } = this.state

    this.fetch()
    if(!isNew) {
      this.fetchLandings()
      this.fetchActions()
    }

    window.addEventListener(`landings.fetch`, this.fetchLandings)
    window.addEventListener(`actions.fetch`, this.fetchActions)
  }

  componentWillUnmount = () => {
    window.removeEventListener(`landings.fetch`, this.fetchLandings)
    window.removeEventListener(`actions.fetch`, this.fetchActions)
  }

  fetch = () => {
    const { id } = this.state.data
    const { isNew } = this.state
    if(!isNew) {
      api.get(`/v1/offers/${id}?expand=countries,trafficSources,categories`)
      .then(response => {
        response.data.traffic_source_ids = response.data.trafficSources.map(item => item.id)
        response.data.country_ids = response.data.countries.map(item => item.id)
        response.data.category_ids = response.data.categories.map(item => item.id)
        delete response.data.trafficSources, response.data.countries, response.data.categories

        // visible
        response.data.visible = response.data.visible == true ? 1 : 0

        this.setState({
          isLoading: false,
          data: response.data
         })
      })
    } else {
      this.setState({ isLoading: false })
    }

    // trafficSources
    api.get(`v1/traffic-sources?fields=id,name&per-page=999`)
    .then(response => this.setState({ sources: response.data }))

    // countries
    api.get(`v1/countries?fields=id,name&per-page=999`)
    .then(response => this.setState({ countries: response.data }))

    // statuses
    api.get(`v1/offers/statuses`)
    .then(response => this.setState({ statuses: response.data }))

    // categories
    api.get(`v1/categories`)
    .then(response => this.setState({ categories: response.data }))

  }

  fetchLandings = () => {
    const { id } = this.state.data
    api.get(`v1/landings`, {
      headers: {
        'x-linkable': 'enabled',
      },
      params: {
        'q[offer_id][equal]': id,
        'per-page': 999,
      }
    })
    .then(response => {
      this.setState({ landings: response.data })
    })
  }

  fetchActions = () => {
    const { id } = this.state.data
    api.get(`v1/actions`, {
      params: {
        'q[offer_id][equal]': id,
        'per-page': 999,
      }
    })
    .then(response => {
      this.setState({ actions: response.data })
    })
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { data } = this.state
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    if(data.hasOwnProperty(name)) options.initialValue = data[name]
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { data, logo_upload_image_id, isNew } = this.state
    const { form } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      values = clean(values)

      // logo
      delete values.logo_upload_image_id
      if(logo_upload_image_id) values.logo_upload_image_id = logo_upload_image_id

      // arrays to json
      values.traffic_source_ids = JSON.stringify(values.traffic_source_ids) || '[]'
      values.country_ids = JSON.stringify(values.country_ids) || '[]'
      values.category_ids = JSON.stringify(values.category_ids) || '[]'

      // description
      values.description = this.refs.description && this.refs.description.getEditorContents()


      if(isNew) {
        api.post(`/v1/offers`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          window.location = `/offers/${response.data.id}`
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        api.patch(`/v1/offers/${data.id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(`Оффер #${data.id} сохранен`)
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }

    })
  }

  _onUploadLogo = (e) => {
    const data = e.file.response
    if(!data) return
    this.setState({
      logo_upload_image_id: data.id,
      new_logo: data.server + data.patch,
    })
  }

  _onChangeDescription = (text, e, t) => {
    console.log(text, e, t);
    //const { data } = this.state
    //data.text = text
    //this.setState({ data: data })
  }

  _onDeleteLanding = (id) => {
    api.delete(`/v1/landings/${id}`)
    .then(response => {
      window.dispatchEvent(new Event('landings.fetch'))
      message.success(`Лендинг #${id} удален`)
    })
  }

  _onDeleteAction = (id) => {
    api.delete(`/v1/actions/${id}`)
    .then(response => {
      window.dispatchEvent(new Event('actions.fetch'))
      message.success(`Цель #${id} удалена`)
    })
  }

  renderTrafficSources = () => {
    const { sources } = this.state
    return sources.map((item, i) => {
      return (
        <p key={i}><Checkbox value={item.id} key={item.id}>{item.name}</Checkbox></p>
      )
    })
  }

  render() {
    const { isLoading, iconLoading, isNew, data, actions, categories, statuses, countries, columns, landings, sources, new_logo } = this.state
    const { currencies } = this.props.config
    return (
      <Form>
      <div className="content__wrapper">
        <div className="content__inner offer">

            <div className="block">
              <div className="row">
                <div className="col-md-10">
                  <div className="row">
                    <div className="col-md-6">
                      {this.validator('name', 'Название', <Input size="large" />, [{ required: true }] )}
                    </div>
                    <div className="col-md-6">
                        {this.validator('url', 'URL', <Input size="large" /> )}
                    </div>
                  </div>
                  {this.validator('short_description', 'Краткое описание', <Input size="large" /> )}
                </div>
                <div className="col-md-2">
                  {this.validator('logo_upload_image_id', 'Логотип', (
                    <Upload
                      onChange={this._onUploadLogo}
                      name="image"
                      action={`https://file.yb.partners/v1/uploads?access_token=${Cookies.get(cookie_prefix + '_access_token')}`}
                      showUploadList={false}
                      listType="picture-card"
                      className="avatar-uploader" >
                      {new_logo ? <img src={new_logo} /> : (data.logo ? <img src={data.logo} /> : <Icon type={'plus'} /> )}
                    </Upload>
                  ))}
                </div>
              </div>

              <div className="ant-row ant-form-item">
                <h4>Описание</h4>
                {((!isLoading && data.description) || (!isLoading && isNew)) && <ReactQuill ref="description" defaultValue={data.description} />}
              </div>
            </div>


            {!isNew && (
              <Table
                className="offer__actions"
                columns={columns.actions}
                rowKey={item => item.id}
                dataSource={actions}
                pagination={false}
                loading={isLoading}
                locale={{ emptyText: Helpers.emptyText }}
                onChange={this.handleTableChange} />
            )}


            {!isNew && (
              <Table
                className="offer__landings streams__form-landings"
                columns={columns.landings}
                rowKey={item => item.id}
                dataSource={landings}
                pagination={false}
                loading={isLoading}
                locale={{ emptyText: Helpers.emptyText }}
                onChange={this.handleTableChange} />
            )}

            <Form.Item style={{ marginTop: '24px' }}>
              <Button type="primary" htmlType="submit" size="large" onClick={this.handleSubmit} loading={iconLoading}>{t('button.save')}</Button>
            </Form.Item>

        </div>
        <div className="content__sidebar">
          <div className="block offer__params">

            <div className="offer__params-global">
              <h3>Параметры</h3>
              {this.validator('category_ids', 'Категории', <Select mode="multiple" optionFilterProp="name" size="large">{categories.map(item => <Select.Option key={item.id} value={item.id} name={item.name}>{item.name}</Select.Option>)}</Select>)}
              {this.validator('status', 'Статус', <Select size="large">{Object.keys(statuses).map(key => <Select.Option key={key} value={key}>{statuses[key]}</Select.Option>)}</Select> )}
              {this.validator('visible', 'Видимый', <Select size="large"><Select.Option key={1} value={1}>Да</Select.Option><Select.Option key={0} value={0}>Нет</Select.Option></Select> )}
            </div>

            <div className="offer__params-sources">
              <h3>Типы трафика</h3>
              {this.validator('traffic_source_ids', '', <Checkbox.Group><div className="offer__params-sources-list">{this.renderTrafficSources()}</div></Checkbox.Group> )}
            </div>

            <div className="offer__params-targeting">
              <h3>Таргетинг</h3>
              {this.validator('country_ids', '', <Select mode="multiple" optionFilterProp="name" size="large">{countries.map(item => <Select.Option key={item.id} value={item.id} name={item.name}>{item.name}</Select.Option>)}</Select>)}
            </div>

          </div>
        </div>
      </div>


      </Form>
    )
  }
}

export default connect((state) => pick(state, 'config'))(Form.create()(Offer))


function flatten(obj) {
 var root = {};
 (function tree(obj, index){
   var suffix = toString.call(obj) == "[object Array]" ? "]" : "";
   for(var key in obj){
    if(!obj.hasOwnProperty(key))continue;
    root[index+key+suffix] = obj[key];
    if( toString.call(obj[key]) == "[object Array]" )tree(obj[key],index+key+suffix+"[");
    if( toString.call(obj[key]) == "[object Object]" )tree(obj[key],index+key+suffix+".");
   }
 })(obj,"");
 return root;
}
