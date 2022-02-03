import {
  decodeSuper,
  defaultMappedTypes,
  encodeSuper,
  mapType,
} from '../src/index';

describe('to/fromSuper', () => {
  it('converts json-unrepresentable values back and forth', async () => {
    const asSuper = encodeSuper({
      date: new Date(0),
      regex: /foo/i,
      set: new Set(['foo', 'bar']),
      map: new Map([
        ['foo1', 'bar1'],
        ['foo2', 'bar2'],
      ]),
      bigint: BigInt(123),
      null: null,
    });

    expect(asSuper.date).toHaveProperty(
      '$rsl$Date',
      '1970-01-01T00:00:00.000Z'
    );
    expect(asSuper.regex).toHaveProperty('$rsl$RegExp', ['foo', 'i']);
    expect(asSuper.set).toHaveProperty('$rsl$Set', ['foo', 'bar']);
    expect(asSuper.map).toHaveProperty('$rsl$Map', [
      ['foo1', 'bar1'],
      ['foo2', 'bar2'],
    ]);
    expect(asSuper.bigint).toHaveProperty('$rsl$bigint', '123');

    const asPlain = decodeSuper(asSuper);

    expect(asPlain).toHaveProperty('date', new Date(0));
    expect(asPlain).toHaveProperty('regex', /foo/i);
    expect(asPlain).toHaveProperty('set', new Set(['foo', 'bar']));
    expect(asPlain).toHaveProperty(
      'map',
      new Map([
        ['foo1', 'bar1'],
        ['foo2', 'bar2'],
      ])
    );
    expect(asPlain).toHaveProperty('bigint', BigInt(123));
  });

  it('custom converters', async () => {
    const mappedTypes = [
      mapType(
        Date,
        (date) => date.getTime(),
        (timestamp) => new Date(timestamp)
      ),
    ];

    const asSuper = encodeSuper(
      {
        date: new Date(0),
      },
      mappedTypes
    );

    expect(asSuper.date).toHaveProperty('$rsl$Date', 0);

    const asPlain = decodeSuper(asSuper, mappedTypes);

    expect(asPlain).toHaveProperty('date', new Date(0));
  });

  it('custom converters with default', async () => {
    class MyClass {
      constructor(public name: string) {}

      greet() {
        return `Hello, ${this.name}`;
      }
    }

    const mappedTypes = [
      ...defaultMappedTypes,
      mapType(
        MyClass,
        (myClass) => myClass.name,
        (value) => new MyClass(value)
      ),
    ];

    const asSuper = encodeSuper(
      {
        myClass: new MyClass('Joe'),
      },
      mappedTypes
    );

    expect(asSuper.myClass).toHaveProperty('$rsl$MyClass', 'Joe');

    const asPlain = decodeSuper(asSuper, mappedTypes);

    expect(asPlain).toHaveProperty('myClass', new MyClass('Joe'));
    expect(asPlain.myClass.greet()).toEqual('Hello, Joe');
  });
});
