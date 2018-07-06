import * as React from 'react';
import * as ReactDOM from 'react-dom';

export class Portal extends React.PureComponent {
  el: HTMLDivElement;
  root: HTMLElement;

  constructor(props: any) {
    super(props);
    this.el = document.createElement('div');
    this.root = document.getElementById('modal-root')!;
  }

  componentDidMount() {
    this.root.appendChild(this.el);
  }

  componentWillUnmount() {
    this.root.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}
