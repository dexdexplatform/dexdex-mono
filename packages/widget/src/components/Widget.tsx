import * as React from 'react';
import { Subscription } from 'rxjs';
import { ApiOptions } from '../model/server-api';
import { WidgetState, WidgetStore, initWidget } from '../model/widget-state';
import './Widget.css';
import WidgetLoader from './WidgetLoader';
import screens from './screens';
import { BN } from 'bn.js';

export interface WidgetManagerState {
  widgetError: boolean;
  widgetState: null | WidgetState;
}

export interface WidgetProps {
  widgetId: string;
  opts: ApiOptions;
}

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
      this.store = await initWidget(this.props.opts, this.props.widgetId);
      this.subscription = this.store.changes.subscribe({
        next: change => {
          this.devTools.send(change.action, change.state);
          this.setState({ widgetState: change.state });
        },
        error: err => {
          console.log('error in store');
          console.log(err);
          this.setState({ widgetError: true });
        },
      });
    } catch (err) {
      console.log('There was an error:', err);
      this.setState({ widgetError: true });
    }
  }

  render() {
    if (this.state.widgetError) {
      return (
        <div style={{ position: 'relative', height: 662 }}>
          <div>There was an error loading the widget!</div>
        </div>
      );
    }

    if (!this.state.widgetState) {
      return <WidgetLoader />;
    }

    const screen = this.state.widgetState.screen;

    const ScreenRenderer = screens[screen].Screen;
    const screenMapper = screens[screen].mapper(this.store);

    return <ScreenRenderer {...screenMapper(this.state.widgetState)} />;
  }
}

export default Widget;
