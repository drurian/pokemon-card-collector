import pikachuSvg from '../../assets/pikachu.svg';

export default function PikachuIcon({ className }) {
  return <img src={pikachuSvg} alt="" className={className} aria-hidden="true" />;
}
