import BN from 'bn.js';
import * as React from 'react';
import { Subscription } from 'rxjs';
import { initWidget, WidgetState, WidgetStore } from '../model/widget-state';
import { closeNoWalletModal } from '../model/widget-state/actions';
import NoWalletModal from './NoWalletModal';
import screens from './screens';
import './Widget.css';
import WidgetLoader from './WidgetLoader';

export interface WidgetManagerState {
  widgetError: boolean;
  widgetState: null | WidgetState;
}

export interface WidgetProps {
  widgetId: string;
  operations: string | null;
  tokens: string | null;
}

const classes = require('./Widget.css');

function connectDevTools(widgetId: string) {
  if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    return (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: widgetId,
      serialize: {
        replacer: (key: string, value: any) => {
          if (key === 'eth') {
            return '<<ETH>>';
          }
          if (
            value != null &&
            typeof value === 'object' &&
            value.constructor !== undefined &&
            BN.isBN(value)
          ) {
            return (value as BN).toString();
          } else {
            return value;
          }
        },
      },
    });
  }
  return {
    send: () => {
      return;
    },
  };
}

class Widget extends React.Component<WidgetProps, WidgetManagerState> {
  private store: WidgetStore;
  private subscription: Subscription | null;
  private devTools: any = connectDevTools(this.props.widgetId);

  constructor(props: WidgetProps) {
    super(props);
    this.state = {
      widgetState: null,
      widgetError: false,
    };
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async componentDidMount() {
    try {
      this.store = await initWidget(this.props.widgetId, this.props.operations, this.props.tokens);
      this.subscription = this.store.changes.subscribe({
        next: change => {
          this.devTools.send(change.action, change.state);
          this.setState({ widgetState: change.state });
        },
        error: err => {
          console.error('store-error', err);
          this.setState({ widgetError: true });
        },
      });
    } catch (err) {
      console.error('init-error:', err);
      this.setState({ widgetError: true });
    }
  }

  refresh: React.MouseEventHandler<any> = e => {
    e.stopPropagation();
    window.location.reload(true);
  };

  closeNoWalletModal = () => {
    this.store.dispatch(closeNoWalletModal());
  };

  render() {
    if (this.state.widgetError) {
      return (
        <div className={classes.widgetError}>
          <p>There was an error loading the app</p>
          <button className={classes.btn} onClick={this.refresh}>
            Click here to refresh
          </button>
        </div>
      );
    }

    if (!this.state.widgetState) {
      return <WidgetLoader />;
    }

    const stage = this.state.widgetState.tradeExecution.stage;
    const ScreenRenderer = screens[stage].Screen;
    const screenMapper = screens[stage].mapper(this.store);

    if (this.state.widgetState.noWalletModalOpen) {
      return (
        <>
          <ScreenRenderer {...screenMapper(this.state.widgetState)} />
          <NoWalletModal closeModal={this.closeNoWalletModal} />
        </>
      );
    } else {
      return <ScreenRenderer {...screenMapper(this.state.widgetState)} />;
    }
  }
}

export default Widget;
