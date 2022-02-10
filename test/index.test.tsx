import 'isomorphic-fetch';
import {
  decodeSuper,
  defaultMappedTypes,
  encodeSuper,
  mapType,
  SuperLoaderFunction,
} from '../src/index';
import { superdata } from '../src/superdata';

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

    expect(asSuper[superdata].date).toHaveProperty(
      '$rsl$Date',
      '1970-01-01T00:00:00.000Z'
    );
    expect(asSuper[superdata].regex).toHaveProperty('$rsl$RegExp', [
      'foo',
      'i',
    ]);
    expect(asSuper[superdata].set).toHaveProperty('$rsl$Set', ['foo', 'bar']);
    expect(asSuper[superdata].map).toHaveProperty('$rsl$Map', [
      ['foo1', 'bar1'],
      ['foo2', 'bar2'],
    ]);
    expect(asSuper[superdata].bigint).toHaveProperty('$rsl$bigint', '123');

    const asPlain = decodeSuper(asSuper[superdata]);

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

    expect(asSuper[superdata].date).toHaveProperty('$rsl$Date', 0);

    const asPlain = decodeSuper(asSuper[superdata], mappedTypes);

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

    expect(asSuper[superdata].myClass).toHaveProperty('$rsl$MyClass', 'Joe');

    const asPlain = decodeSuper(asSuper[superdata], mappedTypes);

    expect(asPlain).toHaveProperty('myClass', new MyClass('Joe'));
    expect(asPlain.myClass.greet()).toEqual('Hello, Joe');
  });

  it('json response wrapper', async () => {
    const loader: SuperLoaderFunction<{ date: Date }> = async () =>
      encodeSuper(
        {
          date: new Date(0),
        },
        undefined,
        {
          headers: {
            'My-Custom-Header': 'My Header Value',
          },
        }
      );

    const asSuper = await loader(null!);

    expect(asSuper[superdata].date).toHaveProperty(
      '$rsl$Date',
      '1970-01-01T00:00:00.000Z'
    );

    const asPlain = decodeSuper(asSuper[superdata]);

    expect(asPlain).toHaveProperty('date', new Date(0));
  });
});
