import React from 'react';

function createApp(view, options = {}) {
  class RemoteViewApp extends React.Component {

    constructor(props) {
      super(props);
      view.bootstrap && view.bootstrap(props, options);
    }

    _getAppProps(props) {
      const { id, className, style, ...otherProps } = props;
      return { id, className, style, otherProps };
    }

    async componentDidMount() {
      let props = this._getAppProps(this.props).otherProps;
      view.mounted && await view.mounted(this.el, props);
      this.update && this.update(this.el, props, null);
    }

    componentWillUnmount() {
      view.unmount && view.unmount(this.el);
    }

    componentDidUpdate(prevProps) {
      let newProps = this._getAppProps(this.props).otherProps;
      let oldProps = this._getAppProps(prevProps).otherProps;
      view.update && view.update(this.el, newProps, oldProps);
    }

    render() {
      let props = { className: 'import-remote-app' };
      if (view.inheritAttrs !== false) {
        const { id, className, style } = this._getAppProps(this.props);
        Object.assign(props, { id, style });
        if (className) props.className += ` ${className}`;
      }
      return <div {...props} ref={el => this.el = el}></div>;
    }

  }
  RemoteViewApp.__import_remote_app__ = true;

  return RemoteViewApp;  
}

export default createApp;