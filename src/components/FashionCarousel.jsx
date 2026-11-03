
import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Image } from '@react-three/drei'
import { ShoppingBag, X, ArrowRight, Minus, Plus } from 'lucide-react'
import { formatPrice } from '../data/storeConfig'
import outfits from '../data/products'

function createCartId() {
  return `${Date.now()}-${Math.random()}`
}

function createDemoOrder(customer, items, subtotal) {
  return {
    customer,
    items,
    subtotal,
    createdAt: new Date().toISOString(),
  }
}

function OutfitCard({ outfit, angle, rotation, onSelect }) {
  const card = useRef()
  const image = useRef()

  useFrame(() => {
    if (!card.current || !image.current) return

    const focus = Math.max(
      0,
      Math.cos(angle + rotation.current),
    )
    const scale = 0.82 + focus * 0.18

    card.current.scale.setScalar(scale)
    image.current.material.opacity = 0.55 + focus * 0.45
  })

  return (
    <group
      ref={card}
      position={[
        Math.sin(angle) * 4.5,
        0,
        Math.cos(angle) * 4.5,
      ]}
      rotation={[0, angle, 0]}
    >
      <Image
        ref={image}
        url={outfit.image}
        position={[0, 0, 0]}
        scale={[2.3, 3.4]}
        transparent
        side={2}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(outfit)
        }}
      />
    </group>
  )
}

function Cards({ rotation, paused, advanceRotation, onSelect, products }) {
  const group = useRef()

  useFrame((_, delta) => {
    if (!group.current) return

    if (!paused.current) {
      advanceRotation(delta)
    }

    group.current.rotation.y = rotation.current
  })

  return (
    <group ref={group}>
      {products.map((outfit, index) => (
        <OutfitCard
          key={outfit.id ?? outfit.title}
          outfit={outfit}
          angle={(index / products.length) * Math.PI * 2}
          rotation={rotation}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

export default function FashionCarousel() {
  const rotation = useRef(0)
  const paused = useRef(false)
  const startX = useRef(0)
  const lastX = useRef(0)
  const hasDragged = useRef(false)

  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState(null)
  const [bag, setBag] = useState([])
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [bagOpen, setBagOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [checkoutOpen, setCheckoutOpen] = useState(false)

const [customer, setCustomer] = useState({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
})

const [orderPlaced, setOrderPlaced] = useState(false)

function advanceRotation(delta) {
  rotation.current += delta * 0.12
}

  const categories = useMemo(
    () => [
      'All',
      ...new Set(
        outfits.map((outfit) => outfit.category).filter(Boolean)
      ),
    ],
    []
  )

  const filteredOutfits = useMemo(() => {
    if (activeCategory === 'All') return outfits

    return outfits.filter(
      (outfit) => outfit.category === activeCategory
    )
  }, [activeCategory])

  const total = bag.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  )

  const bagItemCount = bag.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  )

  function handlePointerDown(event) {
    startX.current = event.clientX
    lastX.current = event.clientX
    hasDragged.current = false
    setDragging(true)
    paused.current = true
  }

  function handlePointerMove(event) {
    if (!dragging) return

    const delta = event.clientX - lastX.current

    if (Math.abs(event.clientX - startX.current) > 5) {
      hasDragged.current = true
    }

    if (hasDragged.current) {
      rotation.current += delta * 0.006
    }

    lastX.current = event.clientX
  }

  function handlePointerUp() {
    setDragging(false)
    paused.current = false
  }

  function closeBag() {
    setBagOpen(false)
    paused.current = false
  }

  function openProduct(outfit) {
    setSelected(outfit)
    setSize(outfit.sizes?.[0] || '')
    setQuantity(1)
  }

  function addToBag() {
    if (!selected || !selected.inStock) return
    if (selected.sizes?.length > 0 && !size) return

    const cartId = createCartId()

    setBag((current) => [
      ...current,
      {
        ...selected,
        size: size || 'One size',
        quantity,
        cartId,
      },
    ])

    setSelected(null)
    setQuantity(1)
  }

  function updateBagQuantity(cartId, change) {
    setBag((current) =>
      current.map((item) =>
        item.cartId === cartId
          ? {
              ...item,
              quantity: Math.max(
                1,
                (item.quantity || 1) + change
              ),
            }
          : item
      )
    )
  }

  function removeFromBag(cartId) {
    setBag((current) =>
      current.filter((item) => item.cartId !== cartId)
    )
  }

  function handleCheckoutSubmit(event) {
  event.preventDefault()

  if (bag.length === 0) return

  const order = createDemoOrder(customer, bag, total)

  console.log('Order details:', order)

  setOrderPlaced(true)
  setBag([])
}

  return (
    <div className="relative">
      {/* Product category filters */}
      <div className="mb-6 flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => {
              setActiveCategory(category)
              rotation.current = 0
            }}
            className={`border px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${
              activeCategory === category
                ? 'border-white bg-white text-black'
                : 'border-white/20 text-neutral-400 hover:border-white hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 3D rotating product carousel */}
      <div
        className={`relative h-[480px] w-full touch-pan-y md:h-[650px] ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <Canvas
          camera={{ position: [0, 0.5, 10], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={1.5} />

          <Cards
            rotation={rotation}
            paused={paused}
            advanceRotation={advanceRotation}
            products={filteredOutfits}
            onSelect={(outfit) => {
              if (!hasDragged.current) openProduct(outfit)
            }}
          />
        </Canvas>

        <button
          type="button"
          onClick={() => {
            paused.current = true
            setBagOpen(true)
          }}
          className="absolute right-6 top-5 z-10 flex items-center gap-2 text-xs uppercase tracking-widest md:right-12"
        >
          <ShoppingBag size={16} />
          Bag ({bagItemCount})
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          Click an outfit to discover it · Drag to explore
        </div>
      </div>

      {/* Product details modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null)
            }
          }}
        >
          <div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-white/15 bg-neutral-950 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close product details"
              className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/70 p-2"
            >
              <X size={18} />
            </button>

            <div className="flex min-h-[300px] items-center justify-center bg-neutral-900 p-6">
              <img
                src={selected.image}
                alt={selected.title}
                className="max-h-[420px] max-w-full object-contain"
              />
            </div>

            <div className="flex flex-col justify-center p-7 md:p-10">
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                {selected.category || 'Collection'}
              </p>

              <h2 className="mt-4 text-2xl font-light tracking-wide">
                {selected.title}
              </h2>

              <p className="mt-4 text-xl">
                {formatPrice(selected.price)}
              </p>

              <p className="mt-5 text-sm leading-7 text-neutral-400">
                {selected.description}
              </p>

              {selected.sizes?.length > 0 && (
                <>
                  <p className="mt-7 text-xs uppercase tracking-widest">
                    Select size
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.sizes.map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setSize(option)}
                        className={`h-10 min-w-12 border px-3 text-xs ${
                          size === option
                            ? 'border-white bg-white text-black'
                            : 'border-white/20 hover:border-white'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Quantity selector */}
              <div className="mt-7">
                <p className="mb-3 text-xs uppercase tracking-widest">
                  Quantity
                </p>

                <div className="flex w-fit items-center border border-white/20">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    aria-label="Decrease quantity"
                    className="px-4 py-3 hover:bg-white/10"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="min-w-10 text-center text-sm">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) => current + 1)
                    }
                    aria-label="Increase quantity"
                    className="px-4 py-3 hover:bg-white/10"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={addToBag}
                disabled={
                  !selected.inStock ||
                  (selected.sizes?.length > 0 && !size)
                }
                className="mt-8 flex w-full items-center justify-center gap-3 bg-white px-5 py-4 text-xs font-semibold uppercase tracking-widest text-black hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                {!selected.inStock
                  ? 'Out of Stock'
                  : selected.sizes?.length > 0 && !size
                    ? 'Select a Size'
                    : 'Add to Bag'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping bag drawer */}
      {bagOpen && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close shopping bag"
            onClick={closeBag}
            className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101010] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h2 className="text-sm uppercase tracking-[0.25em]">
                  Your Bag
                </h2>

                <p className="mt-2 text-xs text-neutral-500">
                  {bagItemCount} item(s)
                </p>
              </div>

              <button
                type="button"
                onClick={closeBag}
                aria-label="Close shopping bag"
                className="p-2 text-neutral-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {bag.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag size={28} className="text-neutral-500" />

                  <p className="mt-5 text-sm">
                    Your bag is empty.
                  </p>

                  <button
                    type="button"
                    onClick={closeBag}
                    className="mt-6 border-b border-white/50 pb-2 text-xs uppercase tracking-widest"
                  >
                    Explore collection
                  </button>
                </div>
              ) : (
                <div className="space-y-5 py-6">
                  {bag.map((item) => (
                    <div
                      key={item.cartId}
                      className="flex gap-4 border-b border-white/10 pb-5"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-28 w-20 bg-neutral-900 object-contain"
                      />

                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="text-xs tracking-wider">
                          {item.title}
                        </p>

                        <p className="mt-2 text-xs text-neutral-500">
                          {item.size !== 'One size'
                            ? `Size: ${item.size}`
                            : 'One size'}
                        </p>

                        <p className="mt-3 text-sm">
                          {formatPrice(
                            item.price * (item.quantity || 1)
                          )}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          {formatPrice(item.price)} each
                        </p>

                        {/* Bag quantity controls */}
                        <div className="mt-3 flex w-fit items-center border border-white/20">
                          <button
                            type="button"
                            onClick={() =>
                              updateBagQuantity(item.cartId, -1)
                            }
                            aria-label={`Decrease quantity of ${item.title}`}
                            className="px-3 py-2 hover:bg-white/10"
                          >
                            <Minus size={12} />
                          </button>

                          <span className="min-w-8 text-center text-xs">
                            {item.quantity || 1}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateBagQuantity(item.cartId, 1)
                            }
                            aria-label={`Increase quantity of ${item.title}`}
                            className="px-3 py-2 hover:bg-white/10"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromBag(item.cartId)}
                          className="mt-3 w-fit text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(bag.length > 0 || checkoutOpen) && (
              <div className="border-t border-white/10 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>

                <p className="mt-3 text-[10px] text-neutral-500">
                  Shipping and taxes calculated at checkout.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(true)
                    paused.current = true
                  }}
                  className="mt-6 flex w-full items-center justify-center gap-3 bg-white py-4 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-neutral-300"
                >
                  Continue to checkout
                  <ArrowRight size={16} />
                </button>

                
      {/* Checkout form */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/90 p-4 backdrop-blur-md">
          <div className="mx-auto my-8 max-w-5xl border border-white/15 bg-neutral-950 p-6 text-white md:p-10">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Secure order details
                </p>
                <h2 className="mt-3 text-2xl font-light">
                  Checkout
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutOpen(false)
                  paused.current = false
                }}
                aria-label="Close checkout"
                className="border border-white/20 p-3 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {orderPlaced ? (
              <div className="py-16 text-center">
                <ShoppingBag size={32} className="mx-auto" />
                <h3 className="mt-6 text-xl">
                  Order details received
                </h3>
                <p className="mt-3 text-sm text-neutral-400">
                  This is a demo confirmation. Your order has not
                  been saved or paid for.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOrderPlaced(false)
                    setCheckoutOpen(false)
                    setBagOpen(false)
                    setCustomer({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      notes: '',
                    })
                    paused.current = false
                  }}
                  className="mt-8 bg-white px-6 py-4 text-xs font-semibold uppercase tracking-widest text-black"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
                <form
                  onSubmit={handleCheckoutSubmit}
                  className="space-y-5"
                >
                  <h3 className="text-sm uppercase tracking-widest">
                    Customer information
                  </h3>

                  {[
                    { key: 'name', label: 'Full name', type: 'text' },
                    { key: 'email', label: 'Email address', type: 'email' },
                    { key: 'phone', label: 'Phone number', type: 'tel' },
                    { key: 'city', label: 'City / Town', type: 'text' },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className="block text-xs text-neutral-400"
                    >
                      {field.label}
                      <input
                        required
                        type={field.type}
                        autoComplete={
                          field.key === 'name'
                            ? 'name'
                            : field.key === 'email'
                              ? 'email'
                              : field.key === 'phone'
                                ? 'tel'
                                : 'address-level2'
                        }
                        value={customer[field.key]}
                        onChange={(event) =>
                          setCustomer((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-white"
                      />
                    </label>
                  ))}

                  <label className="block text-xs text-neutral-400">
                    Delivery address
                    <textarea
                      required
                      rows={3}
                      autoComplete="street-address"
                      value={customer.address}
                      onChange={(event) =>
                        setCustomer((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-white"
                    />
                  </label>

                  <label className="block text-xs text-neutral-400">
                    Delivery notes (optional)
                    <textarea
                      rows={2}
                      value={customer.notes}
                      onChange={(event) =>
                        setCustomer((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-white"
                    />
                  </label>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-3 bg-white px-5 py-4 text-xs font-semibold uppercase tracking-widest text-black hover:bg-neutral-300"
                  >
                    Submit demo order
                    <ArrowRight size={16} />
                  </button>

                  <p className="text-xs leading-5 text-neutral-500">
                    Demo only: this does not create a permanent order
                    or process payment.
                  </p>
                </form>

                <div>
                  <h3 className="mb-5 text-sm uppercase tracking-widest">
                    Your order
                  </h3>

                  <div className="space-y-4">
                    {bag.map((item) => (
                      <div
                        key={item.cartId}
                        className="flex items-center gap-4 border-b border-white/10 pb-4"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-20 w-16 bg-neutral-900 object-contain"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{item.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Size: {item.size} · Qty: {item.quantity || 1}
                          </p>
                        </div>

                        <p className="text-sm">
                          {formatPrice(item.price * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-between border-t border-white/15 pt-5 text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-neutral-500">
                    Delivery fees are not included yet. Payment will
                    be connected separately.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
         
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
