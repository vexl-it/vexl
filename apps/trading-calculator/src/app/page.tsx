import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Calculator } from '@/components/Calculator'
import { Footer } from '@/components/Footer'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.intro}>
          <h2 className={styles.heading}>P2P Bitcoin Trading Calculator</h2>
          <p className={styles.description}>
            Calculate Bitcoin trades with live prices, premium/discount
            adjustments, and multiple currencies. Perfect for peer-to-peer
            trading.
          </p>
        </div>

        <Suspense fallback={<CalculatorSkeleton />}>
          <Calculator />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}

function CalculatorSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonInput} />
      <div className={styles.skeletonInput} />
      <div className={styles.skeletonDivider} />
      <div className={styles.skeletonPrice} />
      <div className={styles.skeletonSlider} />
      <div className={styles.skeletonButtons} />
    </div>
  )
}
