import { FC, useEffect, useState } from 'react'
import Header from '@/components/Header'

import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useContractRead, useContractReads } from 'wagmi'
import nftABI from '@/abi/NFTAbi.json'
import registeryABI from '@/abi/RegistryAbi.json'
import { $purify } from '@kodadot1/minipfs'

import { articles } from '@/articels/articles'
import Link from 'next/link'

const NFT_CONTRACT_ADDRESS = '0x9dfef6f53783c7185c69f45a51bede2c32e4ac3e'
const REGISTERY_CONTRACT_ADDRESS = '0x02101dfB77FDE026414827Fdc604ddAF224F0921'
const IMPLEMENTATION = '0xf999F659c5Ab90E42E466B367BB56e8BD56cE524'
const SALT = 6551

const etherScanBaseUrl = 'https://goerli.etherscan.io/address/'

const House: FC = () => {
	const router = useRouter()
	const { id } = router.query
	const [publication, setPublication] = useState(null)
	const [houseAddress, setHouseAddress] = useState(null)
	const [owner, setOwner] = useState(null)

	const nftContract = {
		addressOrName: NFT_CONTRACT_ADDRESS,
		contractInterface: nftABI,
	}
	const { data: nftData } = useContractRead({
		...nftContract,
		functionName: 'tokenURI',
		args: [0],
	})

	const { data: ownerAddress } = useContractRead({
		...nftContract,
		functionName: 'ownerOf',
		args: [0],
	})

	const { data: registeryData } = useContractRead({
		addressOrName: REGISTERY_CONTRACT_ADDRESS,
		functionName: 'account',
		args: [IMPLEMENTATION, 5, NFT_CONTRACT_ADDRESS, 0, SALT],
		contractInterface: registeryABI,
	})

	const getEtherScanLink = (address: string) => {
		return `${etherScanBaseUrl}${address}`
	}

	useEffect(() => {
		if (registeryData) {
			setHouseAddress(registeryData)
		}
	}, [registeryData])

	useEffect(() => {
		if (ownerAddress) {
			console.log('owner', ownerAddress)
			setOwner(ownerAddress)
		}
	}, [ownerAddress])

	useEffect(() => {
		if (nftData) {
			console.log('nftData', nftData)
			const uri = $purify(nftData as unknown as string)

			fetch(uri[0] as unknown as string)
				.then(response => response.json())
				.then(fetchedData => {
					const cleanImage = $purify(fetchedData.image as unknown as string)
					fetchedData.image = cleanImage[0] as unknown as string
					setPublication(fetchedData)
				})
				.catch(err => {
					console.error('Failed to fetch publication', err)
				})
		}
	}, [nftData])
	// If id is not available, return loading text
	if (!id) {
		return <div>Loading...</div>
	}

	// If id or data is not available, return loading text
	if (!id || !publication) {
		return <div>Loading...</div>
	}
	return (
		<div className="relative flex items-top justify-center min-h-screen bg-gray-100 dark:bg-gray-900 sm:items-center py-4 sm:pt-0">
			<div className="w-full absolute top-0">
				<Header />
			</div>
			<ThemeSwitcher className="absolute bottom-6 right-6" />
			<div className="container mx-auto p-4 py-20">
				<div className="w-full py-10">
					{/* Banner Image */}
					<div className="w-full">
						<Image
							src={publication.image || ''}
							alt={publication.name}
							layout="responsive"
							// fill={true}
							width={1200}
							height={600}
							style={{ objectFit: 'contain' }}
							className="object-contain"
						/>
					</div>
					{/* Info Section */}
					<div className="flex justify-between items-start mt-4">
						<div>
							<div className="text-2xl font-semibold">{publication.name}</div>
							<div className="mt-2">{publication.description}</div>
							<div className="mt-2">
								<span>Owner:</span>{' '}
								<a className="text-blue-500 underline" href={getEtherScanLink(owner)}>
									{owner}
								</a>
							</div>
							<div className="mt-2">
								<span>House Address:</span>{' '}
								<a className="text-blue-500 underline" href={getEtherScanLink(houseAddress)}>
									{houseAddress}
								</a>
							</div>
							{/* <div className="mt-2">Price: ${publication.price.toFixed(2)}</div> */}
						</div>
						<div>
							<button className="bg-blue-500 text-white px-4 py-2 rounded">Buy/Sell</button>
						</div>
					</div>
					{/* Articles Section */}
					<div className="mt-6">
						<h2 className="text-xl font-semibold mb-2">Articles:</h2>
						{articles.map((article, index) => (
							<div key={index} className="flex items-start space-x-4">
								{/* Article Image */}
								<div className="w-1/3">
									<Link href={`/house/${id}/article/${index}`}>
										<a className="block">
											<img
												src={$purify(article.image)[0]}
												alt={article.name}
												className="rounded-md max-w-full h-auto"
											/>
										</a>
									</Link>
								</div>
								{/* Article Information */}
								<div className="w-2/3">
									<Link href={`/house/${id}/article/${index}`}>
										<a className="block">
											<h3 className="font-bold text-2xl">{article.name}</h3>
											<p className="text-sm text-gray-500 mb-2">created by:</p>
											<div className="text-base">{article.content}</div>
											{/* Tags */}
											<div className="mt-2">
												<span className="font-semibold">Tags:</span>
												<ul className="inline-block pl-2">
													{article.tags.map((tag, index) => (
														<li
															key={index}
															className="inline-block mr-2 text-sm bg-gray-200 rounded-full px-2"
														>
															{tag}
														</li>
													))}
												</ul>
											</div>{' '}
										</a>
									</Link>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default House
