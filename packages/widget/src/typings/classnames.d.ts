// declare module 'classnames' {
//   type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | false;

//   interface ClassDictionary {
//     [id: string]: boolean | undefined | null;
//   }

//   interface ClassArray extends Array<ClassValue> {}

//   interface ClassNamesFn {
//     (...classes: ClassValue[]): string;
//   }

//   var classNames: ClassNamesFn;

//   export default classNames;
// }

declare module 'classnames/bind' {
  type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | false;

  interface ClassDictionary {
    [id: string]: boolean | undefined | null;
  }

  interface ClassArray extends Array<ClassValue> {}

  interface ClassNamesFn {
    (...classes: ClassValue[]): string;
  }

  var classNames: ClassNamesFn;

  export function bind(styles: Record<string, string>): ClassNamesFn;
}
